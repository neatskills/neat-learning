#!/usr/bin/env node

/**
 * Compression utilities - consolidate mastered concepts
 */

const matter = require('gray-matter');
const fs = require('node:fs');
const path = require('node:path');
const { isMastered, daysSince, now: getNow } = require('./utils');

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
      if (isMastered(concept) && !concept.compressed) {
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
    ? daysSince(firstMasteredDate.toISOString())
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
const ACTIVITY_FORMATS = {
  learn: { dateField: 'date', fields: ['questions', 'hints_needed', 'signals'] },
  synthesize: { dateField: 'completed', fields: ['terms', 'mental_model'] },
  practice: { dateField: 'date', fields: ['independence', 'exercises'] },
  calibrate: { dateField: 'date', fields: ['tradeoffs', 'expert_thinking'] }
};

function formatActivity(activityType, activity) {
  const config = ACTIVITY_FORMATS[activityType];
  const typeName = activityType.charAt(0).toUpperCase() + activityType.slice(1);
  let content = `#### ${typeName} ✓\n`;

  content += `${config.dateField}: ${activity[config.dateField] || activity.date}\n`;

  config.fields.forEach(field => {
    if (!activity[field]) return;

    const value = activity[field];
    if (field === 'questions') {
      content += `questions:\n  correct: ${value.correct}\n  total: ${value.total}\n`;
    } else if (field === 'tradeoffs') {
      content += `tradeoffs:\n  correct: ${value.correct}\n  total: ${value.total}\n`;
    } else if (field === 'terms' && Array.isArray(value)) {
      content += 'terms:\n' + value.map(t => '  - ' + t).join('\n') + '\n';
    } else if (field === 'exercises' && Array.isArray(value)) {
      const exerciseLines = value.map(e => '  - name: ' + e.name + '\n    status: ' + e.status + '\n    errors: ' + e.errors).join('\n');
      content += 'exercises:\n' + exerciseLines + '\n';
    } else if (field === 'expert_thinking' && Array.isArray(value) && value.length > 0) {
      content += 'expert_thinking:\n' + value.map(t => '  - ' + t).join('\n') + '\n';
    } else if (field === 'signals' && value.strengths?.length > 0) {
      content += `signals:\n  strengths: [${value.strengths.join(', ')}]\n`;
    } else if (typeof value === 'string') {
      content += `${field}: "${value}"\n`;
    } else if (typeof value === 'boolean') {
      content += `${field}: ${value}\n`;
    } else {
      content += `${field}: ${value}\n`;
    }
  });

  return content + '\n';
}

function generateArchive(sectionName, concepts) {
  const archiveDate = getNow().split('T')[0];
  const conceptNames = concepts.map(c => c.name).join(', ');

  let content = `# ${sectionName} - Mastered Concepts Archive\n\n`;
  content += `Archived: ${archiveDate}\n`;
  content += `Concepts: ${concepts.length} (${conceptNames})\n\n`;
  content += `---\n\n`;

  concepts.forEach(concept => {
    content += `### ${concept.name}\n\n`;
    content += `**Level:** ${concept.level}\n\n`;
    content += `**Status:** ${concept.activity?.status || 'mastered'}\n\n`;

    if (concept.activity) {
      ['learn', 'synthesize', 'practice', 'calibrate'].forEach(activityType => {
        if (concept.activity[activityType]) {
          content += formatActivity(activityType, concept.activity[activityType]);
        }
      });
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
  const mastered = section.concepts.filter(c => isMastered(c) && !c.compressed);

  if (mastered.length === 0) {
    return { section, archiveFile: null };
  }

  // Generate archive
  const archiveDate = getNow().split('T')[0];
  const archiveFilename = `${section.name.toLowerCase().replace(/\s+/g, '-')}-mastered-${archiveDate}.md`;
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
  section.compressed_date = getNow();
  section.archive_path = `archive/${archiveFilename}`;
  section.mastered_count = mastered.length;

  // Strip activity history from compressed concepts (mastered already filtered above)
  const masteredNames = new Set(mastered.map(c => c.name));
  section.concepts = section.concepts.map(concept => {
    if (masteredNames.has(concept.name)) {
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
