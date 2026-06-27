# Concept Granularity

## Rule: One Concept = One Tradeoff Decision

A concept is the right size if:
1. Can be explained in 2-3 minutes to someone who knows prerequisites
2. Has a clear "when NOT to use this" answer (tradeoff exists)
3. Can be tested independently

## Examples

**Kubernetes:**
- ✓ Pod (one concept) - includes single/multi-container, init containers
  - Tradeoff: Pod vs higher-level controllers
- ✓ Service types (split into 3): ClusterIP, NodePort, LoadBalancer
  - Each has distinct tradeoffs for when to use
- ✗ Kubernetes networking (too broad) - split into Service, Ingress, NetworkPolicy

**Negotiation:**
- ✓ Anchoring (one concept) - when/how to anchor
- ✓ BATNA (one concept) - know your alternatives
- ✗ Negotiation tactics (too broad) - split into specific techniques

**Finance:**
- ✓ DCF valuation (one concept) - when DCF vs comparables
- ✗ Valuation methods (too broad) - split into DCF, Comparables, Precedents
