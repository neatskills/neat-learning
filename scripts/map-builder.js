// Map templates for common topic + goal combinations
const mapTemplates = {
  kubernetes: {
    'deploy applications': {
      sections: [
        {
          name: 'Foundation',
          concepts: [
            {
              name: 'Pod',
              description: 'Smallest deployable unit, wraps containers',
              dependencies: {
                requires: ['container-basics'],
                enables: ['deployment', 'replicaset', 'statefulset']
              }
            }
          ]
        },
        {
          name: 'Workflow',
          concepts: [
            {
              name: 'Deployment',
              description: 'Manages Pod replicas automatically',
              dependencies: {
                requires: ['pod'],
                enables: ['scaling', 'rolling-updates']
              }
            },
            {
              name: 'Service',
              description: 'Exposes Pods to network traffic',
              dependencies: {
                requires: ['pod'],
                enables: ['ingress']
              }
            }
          ]
        },
        {
          name: 'Configuration',
          concepts: [
            { name: 'ConfigMap', description: 'Non-sensitive configuration', dependencies: { requires: ['pod'], enables: [] } },
            { name: 'Secret', description: 'Sensitive data', dependencies: { requires: ['pod'], enables: [] } }
          ]
        },
        {
          name: 'Storage',
          concepts: [
            { name: 'Volume', description: 'Persistent data', dependencies: { requires: ['pod'], enables: ['persistent-volume'] } }
          ]
        }
      ]
    },
    'cka certification': {
      sections: [
        {
          name: 'Core Concepts',
          concepts: [
            { name: 'Pod', description: 'Basic unit', dependencies: { requires: [], enables: ['deployment'] } },
            { name: 'Namespace', description: 'Isolation', dependencies: { requires: [], enables: [] } },
            { name: 'Node', description: 'Worker machine', dependencies: { requires: [], enables: [] } }
          ]
        },
        {
          name: 'Workloads',
          concepts: [
            { name: 'Deployment', description: 'Stateless apps', dependencies: { requires: ['pod'], enables: [] } },
            { name: 'StatefulSet', description: 'Stateful apps', dependencies: { requires: ['pod'], enables: [] } },
            { name: 'DaemonSet', description: 'One per node', dependencies: { requires: ['pod'], enables: [] } },
            { name: 'Job', description: 'One-time tasks', dependencies: { requires: ['pod'], enables: [] } }
          ]
        },
        {
          name: 'Networking',
          concepts: [
            { name: 'Service', description: 'Network abstraction', dependencies: { requires: ['pod'], enables: [] } },
            { name: 'Ingress', description: 'HTTP routing', dependencies: { requires: ['service'], enables: [] } },
            { name: 'NetworkPolicy', description: 'Firewall rules', dependencies: { requires: ['pod'], enables: [] } }
          ]
        },
        {
          name: 'Storage',
          concepts: [
            { name: 'Volume', description: 'Pod storage', dependencies: { requires: ['pod'], enables: [] } },
            { name: 'PersistentVolume', description: 'Cluster storage', dependencies: { requires: ['volume'], enables: [] } },
            { name: 'PersistentVolumeClaim', description: 'Storage request', dependencies: { requires: ['persistentvolume'], enables: [] } }
          ]
        },
        {
          name: 'Configuration',
          concepts: [
            { name: 'ConfigMap', description: 'Config data', dependencies: { requires: [], enables: [] } },
            { name: 'Secret', description: 'Sensitive data', dependencies: { requires: [], enables: [] } }
          ]
        }
      ]
    }
  },
  negotiation: {
    'salary negotiation': {
      sections: [
        {
          name: 'Foundation',
          concepts: [
            { name: 'BATNA', description: 'Best Alternative To Negotiated Agreement', dependencies: { requires: [], enables: ['anchoring'] } },
            { name: 'Reservation Price', description: 'Walk-away point', dependencies: { requires: [], enables: [] } }
          ]
        },
        {
          name: 'Tactics',
          concepts: [
            { name: 'Anchoring', description: 'First offer sets range', dependencies: { requires: ['batna'], enables: [] } },
            { name: 'Mirroring', description: 'Repeat last words', dependencies: { requires: [], enables: [] } },
            { name: 'Silence', description: 'Strategic pause', dependencies: { requires: [], enables: [] } }
          ]
        },
        {
          name: 'Strategy',
          concepts: [
            { name: 'Multi-issue negotiation', description: 'Trade across multiple factors', dependencies: { requires: ['batna'], enables: [] } },
            { name: 'Time pressure', description: 'Using deadlines', dependencies: { requires: [], enables: [] } }
          ]
        }
      ]
    }
  }
};

function buildInitialMap(topic, goal, domain) {
  const topicKey = topic.toLowerCase();
  const goalKey = goal.toLowerCase();

  // Try to find matching template
  if (mapTemplates[topicKey] && mapTemplates[topicKey][goalKey]) {
    return mapTemplates[topicKey][goalKey];
  }

  // Fallback: generic map based on domain
  return buildGenericMap(topic, goal, domain);
}

function buildGenericMap(topic, goal, domain) {
  // Generic structure when no template exists
  return {
    sections: [
      {
        name: 'Foundation',
        concepts: [
          {
            name: `${topic} Basics`,
            description: `Fundamental concepts of ${topic}`,
            dependencies: { requires: [], enables: [] }
          }
        ]
      },
      {
        name: 'Core',
        concepts: [
          {
            name: `${topic} Practice`,
            description: `Practical application of ${topic}`,
            dependencies: { requires: [`${topic.toLowerCase()}-basics`], enables: [] }
          }
        ]
      }
    ]
  };
}

module.exports = { buildInitialMap };
