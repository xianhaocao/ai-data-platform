<template>
  <div class="relation-graph-container">
    <svg ref="svgRef" class="relation-graph-svg"></svg>
    <div ref="infoPanelRef" class="node-info-panel"></div>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: 'RelationGraph',
  props: {
    data: {
      type: Object,
      default: () => ({ nodes: [], links: [] })
    }
  },
  data() {
    return {
      svg: null,
      simulation: null,
      nodes: [],
      links: [],
      nodeElements: null,
      linkElements: null,
      infoPanel: null,
      focusedNode: null
    };
  },
  mounted() {
    this.initGraph();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.simulation) {
      this.simulation.stop();
    }
  },
  methods: {
    initGraph() {
      const container = this.$refs.svgRef;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Clear previous content
      d3.select(container).selectAll('*').remove();

      this.svg = d3.select(container)
        .attr('width', width)
        .attr('height', height);

      // Add zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          this.svg.select('.graph-group').attr('transform', event.transform);
        });

      this.svg.call(zoom);

      const graphGroup = this.svg.append('g').attr('class', 'graph-group');

      // Create arrow marker
      this.svg.append('defs').selectAll('marker')
        .data(['arrow'])
        .enter().append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999');

      // Initialize nodes and links
      this.nodes = this.data.nodes.map(d => ({ ...d }));
      this.links = this.data.links.map(d => ({ ...d }));

      // Create simulation
      this.simulation = d3.forceSimulation(this.nodes)
        .force('link', d3.forceLink(this.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));

      // Create links
      this.linkElements = graphGroup.append('g')
        .selectAll('line')
        .data(this.links)
        .enter().append('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#arrow)');

      // Create nodes
      this.nodeElements = graphGroup.append('g')
        .selectAll('circle')
        .data(this.nodes)
        .enter().append('circle')
        .attr('r', 20)
        .attr('fill', d => d.color || '#69b3a2')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .call(d3.drag()
          .on('start', this.handleDragStart)
          .on('drag', this.handleDrag)
          .on('end', this.handleDragEnd))
        .on('click', this.handleNodeClick)
        .on('mouseover', this.handleNodeMouseOver)
        .on('mouseout', this.handleNodeMouseOut);

      // Update positions on each tick
      this.simulation.on('tick', () => {
        this.linkElements
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        this.nodeElements
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);
      });

      // Initialize info panel
      this.infoPanel = d3.select(this.$refs.infoPanelRef);
    },
    handleDragStart(event, d) {
      if (!event.active) this.simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    },
    handleDrag(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    },
    handleDragEnd(event, d) {
      if (!event.active) this.simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    },
    handleNodeClick(event, d) {
      this.focusNode(d);
    },
    handleNodeMouseOver(event, d) {
      this.showNodeInfo(d, event);
    },
    handleNodeMouseOut() {
      this.hideNodeInfo();
    },
    focusNode(node) {
      // Reset all elements
      this.nodeElements
        .style('opacity', 0.3)
        .style('stroke-width', 2);

      this.linkElements
        .style('opacity', 0.1);

      // Highlight connected paths
      const connectedNodes = new Set();
      const connectedLinks = new Set();

      // Find all connected nodes and links
      this.findConnectedPaths(node, connectedNodes, connectedLinks);

      // Highlight focused node
      this.nodeElements
        .filter(d => d.id === node.id)
        .style('opacity', 1)
        .style('stroke-width', 4);

      // Highlight connected nodes
      this.nodeElements
        .filter(d => connectedNodes.has(d.id))
        .style('opacity', 1);

      // Highlight connected links
      this.linkElements
        .filter(d => connectedLinks.has(d.id))
        .style('opacity', 0.8)
        .style('stroke-width', 2);

      this.focusedNode = node;
    },
    findConnectedPaths(node, nodesSet, linksSet) {
      // BFS to find all connected nodes
      const queue = [node];
      const visited = new Set();
      visited.add(node.id);

      while (queue.length > 0) {
        const current = queue.shift();
        nodesSet.add(current.id);

        // Find all outgoing links
        this.links.forEach(link => {
          if (link.source.id === current.id || link.source === current.id) {
            linksSet.add(link.id);
            const target = link.target.id ? link.target : link.target;
            if (!visited.has(target.id || target)) {
              visited.add(target.id || target);
              const targetNode = this.nodes.find(n => n.id === (target.id || target));
              if (targetNode) {
                queue.push(targetNode);
              }
            }
          } else if (link.target.id === current.id || link.target === current.id) {
            linksSet.add(link.id);
            const source = link.source.id ? link.source : link.source;
            if (!visited.has(source.id || source)) {
              visited.add(source.id || source);
              const sourceNode = this.nodes.find(n => n.id === (source.id || source));
              if (sourceNode) {
                queue.push(sourceNode);
              }
            }
          }
        });
      }
    },
    showNodeInfo(node, event) {
      this.infoPanel
        .style('display', 'block')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px')
        .html(`
          <div class="node-info-header">
            <h4>${node.label || node.id}</h4>
          </div>
          <div class="node-info-content">
            <p><strong>ID:</strong> ${node.id}</p>
            <p><strong>Type:</strong> ${node.type || 'Unknown'}</p>
            <p><strong>Properties:</strong> ${JSON.stringify(node.properties || {}, null, 2)}</p>
          </div>
        `);
    },
    hideNodeInfo() {
      this.infoPanel.style('display', 'none');
    },
    handleResize() {
      this.initGraph();
    },
    resetView() {
      // Reset all elements to original state
      this.nodeElements
        .style('opacity', 1)
        .style('stroke-width', 2);

      this.linkElements
        .style('opacity', 0.6)
        .style('stroke-width', 1.5);

      this.focusedNode = null;
    }
  },
  watch: {
    data: {
      deep: true,
      handler() {
        this.initGraph();
      }
    }
  }
};
</script>

<style scoped>
.relation-graph-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.relation-graph-svg {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
}

.node-info-panel {
  position: absolute;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 300px;
  font-size: 14px;
  display: none;
}

.node-info-header h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.node-info-content p {
  margin: 4px 0;
  color: #666;
}
</style>