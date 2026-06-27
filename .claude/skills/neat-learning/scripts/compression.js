#!/usr/bin/env node

/**
 * Compression utilities - consolidate mastered concepts
 */

const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');

/**
 * Check if compression should be offered
 * @param {Array<Object>} sections - All sections from state
 * @param {string} started - ISO date when learning started
 * @returns {Object} {shouldOffer, masteredCount, daysSinceFirst}
 */
function shouldOfferCompression(sections, started) {
  let masteredCount = 0;
  let firstMasteredDate = null;

  sections.forEach(section => {
    section.concepts.forEach(concept => {
      if ((concept.level || 0) >= 5 && !concept.compressed) {
        masteredCount++;

        const masteredDate = concept.activity?.calibrate?.date || concept.last_activity;
        if (masteredDate) {
          const date = new Date(masteredDate);
          if (!firstMasteredDate || date < firstMasteredDate) {
            firstMasteredDate = date;
          }
        }
      }
    });
  });

  const daysSinceFirst = firstMasteredDate
    ? Math.floor((Date.now() - firstMasteredDate.getTime()) / 86400000)
    : 0;

  const shouldOffer = masteredCount >= 10 && daysSinceFirst >= 30;

  return {
    shouldOffer,
    masteredCount,
    daysSinceFirst
  };
}

/**
 * Generate compression archive content
 * @param {string} sectionName - Section name
 * @param {Array<Object>} concepts - Concepts to archive
 * @returns {string} Markdown content for archive
 */
function generateArchive(sectionName, concepts) {
  const now = new Date().toISOString().split('T')[0];
  const conceptNames = concepts.map(c => c.name).join(', ');

  let content = `# ${sectionName} - Mastered Concepts Archive\n\n`;
  content += `Archived: ${now}\n`;
  content += `Concepts: ${concepts.length} (${conceptNames})\n\n`;
  content += `---\n\n`;

  concepts.forEach(concept => {
    content += `### ${concept.name}\n\n`;
    content += `**Level:** ${concept.level}\n\n`;
    content += `**Status:** ${concept.activity?.status || 'mastered'}\n\n`;

    // Include full activity history
    if (concept.activity) {
      if (concept.activity.discover) {
        content += `#### Discover ✓\n`;
        content += `date: ${concept.activity.discover.date}\n`;
        content += `questions:\n`;
        content += `  correct: ${concept.activity.discover.questions.correct}\n`;
        content += `  total: ${concept.activity.discover.questions.total}\n`;
        content += `hints_needed: ${concept.activity.discover.hints_needed}\n`;
        if (concept.activity.discover.signals?.strengths?.length > 0) {
          content += `signals:\n`;
          content += `  strengths: [${concept.activity.discover.signals.strengths.join(', ')}]\n`;
        }
        content += `\n`;
      }

      if (concept.activity.name) {
        content += `#### Name ✓\n`;
        content += `vocabulary_introduced: ${concept.activity.name.date}\n`;
        content += `terms:\n`;
        concept.activity.name.terms.forEach(term => {
          content += `  - ${term}\n`;
        });
        content += `\n`;
      }

      if (concept.activity.practice) {
        content += `#### Practice ✓\n`;
        content += `date: ${concept.activity.practice.date}\n`;
        content += `independence: ${concept.activity.practice.independence}\n`;
        if (concept.activity.practice.exercises) {
          content += `exercises:\n`;
          concept.activity.practice.exercises.forEach(ex => {
            content += `  - name: ${ex.name}\n`;
            content += `    status: ${ex.status}\n`;
            content += `    errors: ${ex.errors}\n`;
          });
        }
        content += `\n`;
      }

      if (concept.activity.calibrate) {
        content += `#### Calibrate ✓\n`;
        content += `date: ${concept.activity.calibrate.date}\n`;
        content += `tradeoffs:\n`;
        content += `  correct: ${concept.activity.calibrate.tradeoffs.correct}\n`;
        content += `  total: ${concept.activity.calibrate.tradeoffs.total}\n`;
        if (concept.activity.calibrate.expert_thinking?.length > 0) {
          content += `expert_thinking:\n`;
          concept.activity.calibrate.expert_thinking.forEach(thought => {
            content += `  - ${thought}\n`;
          });
        }
        content += `\n`;
      }
    }

    content += `**Review interval:** ${concept.review_interval} seconds\n`;
    content += `**Last activity:** ${concept.last_activity}\n\n`;
    content += `---\n\n`;
  });

  return content;
}

/**
 * Compress a section's mastered concepts
 * @param {Object} section - Section to compress
 * @param {string} archivePath - Full path to archive directory
 * @returns {Object} {section: updated section, archiveFile: archive filename}
 */
function compressSection(section, archivePath) {
  const mastered = section.concepts.filter(c => (c.level || 0) >= 5 && !c.compressed);

  if (mastered.length === 0) {
    return { section, archiveFile: null };
  }

  // Generate archive
  const now = new Date().toISOString().split('T')[0];
  const archiveFilename = `${section.name.toLowerCase().replace(/\s+/g, '-')}-mastered-${now}.md`;
  const archiveContent = generateArchive(section.name, mastered);

  // Ensure archive directory exists
  if (!fs.existsSync(archivePath)) {
    fs.mkdirSync(archivePath, { recursive: true });
  }

  // Write archive
  const archiveFullPath = path.join(archivePath, archiveFilename);
  fs.writeFileSync(archiveFullPath, archiveContent, 'utf8');

  // Update section
  section.compressed = true;
  section.compressed_date = new Date().toISOString();
  section.archive_path = `archive/${archiveFilename}`;
  section.mastered_count = mastered.length;

  // Strip activity history from compressed concepts
  section.concepts = section.concepts.map(concept => {
    if ((concept.level || 0) >= 5 && !concept.compressed) {
      return {
        name: concept.name,
        level: concept.level,
        review_interval: concept.review_interval,
        last_activity: concept.last_activity,
        compressed: true
      };
    }
    return concept;
  });

  return { section, archiveFile: archiveFilename };
}

/**
 * Decompress a concept (restore from archive)
 * @param {string} conceptName - Name of concept to restore
 * @param {string} archiveFullPath - Full path to archive file
 * @returns {Object|null} Restored concept with full history, or null if not found
 */
function decompressConcept(conceptName, archiveFullPath) {
  if (!fs.existsSync(archiveFullPath)) {
    return null;
  }

  const archiveContent = fs.readFileSync(archiveFullPath, 'utf8');

  // Parse archive to extract concept
  // This is a simplified parser - in production would use proper markdown parsing
  const conceptMarker = `### ${conceptName}\n`;
  const startIdx = archiveContent.indexOf(conceptMarker);

  if (startIdx === -1) {
    return null;
  }

  const nextConceptIdx = archiveContent.indexOf('\n### ', startIdx + conceptMarker.length);
  const endIdx = nextConceptIdx === -1 ? archiveContent.length : nextConceptIdx;

  const conceptBlock = archiveContent.substring(startIdx, endIdx);

  // Parse concept data (simplified - would need full YAML/markdown parser)
  // For now, return a stub indicating decompression worked
  return {
    name: conceptName,
    decompressed: true,
    archiveBlock: conceptBlock
  };
}

module.exports = {
  shouldOfferCompression,
  generateArchive,
  compressSection,
  decompressConcept
};

// CLI usage
if (require.main === module) {
  console.log('Compression functions loaded');
  console.log('Import and use: shouldOfferCompression, generateArchive, compressSection, decompressConcept');
}
