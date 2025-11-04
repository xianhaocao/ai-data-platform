<template>
  <div class="virtual-scroll-chart-container">
    <div class="chart-header">
      <div class="performance-metrics">
        <span>FPS: {{ fps }}</span>
        <span>Memory: {{ memoryUsage }} MB</span>
        <span>Rendered Rows: {{ renderedRows }}</span>
      </div>
    </div>
    <div ref="containerRef" class="chart-container">
      <canvas ref="canvasRef" class="chart-canvas"></canvas>
      <div ref="scrollbarRef" class="scrollbar">
        <div ref="thumbRef" class="scrollbar-thumb"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VirtualScrollChart',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    rowHeight: {
      type: Number,
      default: 20
    },
    itemWidth: {
      type: Number,
      default: 800
    }
  },
  data() {
    return {
      container: null,
      canvas: null,
      ctx: null,
      scrollbar: null,
      thumb: null,
      containerHeight: 0,
      contentHeight: 0,
      scrollTop: 0,
      visibleRows: 0,
      startIndex: 0,
      endIndex: 0,
      fps: 0,
      memoryUsage: 0,
      renderedRows: 0,
      animationFrameId: null,
      lastTime: performance.now(),
      frameCount: 0,
      fpsTime: 0
    };
  },
  mounted() {
    this.initComponent();
    this.startPerformanceMonitoring();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  },
  methods: {
    initComponent() {
      this.container = this.$refs.containerRef;
      this.canvas = this.$refs.canvasRef;
      this.ctx = this.canvas.getContext('2d');
      this.scrollbar = this.$refs.scrollbarRef;
      this.thumb = this.$refs.thumbRef;

      this.containerHeight = this.container.clientHeight;
      this.contentHeight = this.data.length * this.rowHeight;
      this.visibleRows = Math.ceil(this.containerHeight / this.rowHeight) + 2;

      // Set canvas size
      this.canvas.width = this.itemWidth;
      this.canvas.height = this.containerHeight;

      // Initialize scrollbar
      this.updateScrollbar();

      // Add event listeners
      this.container.addEventListener('scroll', this.handleScroll);
      this.scrollbar.addEventListener('click', this.handleScrollbarClick);
      this.thumb.addEventListener('mousedown', this.handleThumbMouseDown);

      // Start rendering
      this.render();
    },
    render() {
      const startTime = performance.now();

      // Calculate visible range
      this.scrollTop = this.container.scrollTop;
      this.startIndex = Math.max(0, Math.floor(this.scrollTop / this.rowHeight));
      this.endIndex = Math.min(this.data.length - 1, this.startIndex + this.visibleRows);
      this.renderedRows = this.endIndex - this.startIndex + 1;

      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Render visible rows
      const offsetY = this.scrollTop - (this.startIndex * this.rowHeight);

      for (let i = this.startIndex; i <= this.endIndex; i++) {
        const row = this.data[i];
        const y = (i - this.startIndex) * this.rowHeight - offsetY;
        
        if (y > this.containerHeight || y < -this.rowHeight) continue;

        // Draw row background
        this.ctx.fillStyle = i % 2 === 0 ? '#f9f9f9' : '#ffffff';
        this.ctx.fillRect(0, y, this.canvas.width, this.rowHeight);

        // Draw row border
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, y, this.canvas.width, this.rowHeight);

        // Draw data
        this.ctx.fillStyle = '#333333';
        this.ctx.font = '12px sans-serif';
        this.ctx.textBaseline = 'middle';
        
        // Example: render first 3 properties
        const properties = Object.values(row).slice(0, 3);
        properties.forEach((value, idx) => {
          const x = 10 + idx * 200;
          this.ctx.fillText(value.toString(), x, y + this.rowHeight / 2);
        });
      }

      // Update FPS
      this.calculateFPS(startTime);

      // Continue rendering
      this.animationFrameId = requestAnimationFrame(() => this.render());
    },
    handleScroll() {
      // Scroll event is passive, rendering will happen in next frame
    },
    handleResize() {
      this.containerHeight = this.container.clientHeight;
      this.visibleRows = Math.ceil(this.containerHeight / this.rowHeight) + 2;
      this.canvas.height = this.containerHeight;
      this.updateScrollbar();
    },
    updateScrollbar() {
      const thumbHeight = Math.max(20, (this.containerHeight / this.contentHeight) * this.containerHeight);
      this.thumb.style.height = thumbHeight + 'px';
    },
    handleScrollbarClick(event) {
      const rect = this.scrollbar.getBoundingClientRect();
      const clickY = event.clientY - rect.top;
      const scrollRatio = clickY / this.containerHeight;
      this.container.scrollTop = scrollRatio * (this.contentHeight - this.containerHeight);
    },
    handleThumbMouseDown(event) {
      event.preventDefault();
      const startY = event.clientY;
      const startScrollTop = this.container.scrollTop;

      const handleMouseMove = (e) => {
        const deltaY = e.clientY - startY;
        const scrollRatio = deltaY / this.containerHeight;
        const newScrollTop = startScrollTop + scrollRatio * (this.contentHeight - this.containerHeight);
        this.container.scrollTop = Math.max(0, Math.min(this.contentHeight - this.containerHeight, newScrollTop));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    calculateFPS(renderTime) {
      const now = performance.now();
      const frameTime = now - this.lastTime;
      this.lastTime = now;
      
      this.frameCount++;
      this.fpsTime += frameTime;

      if (this.fpsTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / this.fpsTime);
        this.frameCount = 0;
        this.fpsTime = 0;
      }
    },
    startPerformanceMonitoring() {
      // Monitor memory usage
      setInterval(() => {
        if (performance.memory) {
          this.memoryUsage = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        }
      }, 1000);
    },
    loadDataSlice(start, end) {
      // Simulate data slicing from backend
      // In real implementation, this would be an API call
      return new Promise((resolve) => {
        setTimeout(() => {
          const slice = this.data.slice(start, end);
          resolve(slice);
        }, 100);
      });
    }
  },
  watch: {
    data: {
      deep: true,
      handler(newData) {
        this.contentHeight = newData.length * this.rowHeight;
        this.updateScrollbar();
      }
    }
  }
};
</script>

<style scoped>
.virtual-scroll-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.chart-header {
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

.performance-metrics {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #666;
}

.chart-container {
  flex: 1;
  position: relative;
  overflow: auto;
}

.chart-canvas {
  display: block;
}

.scrollbar {
  position: absolute;
  right: 0;
  top: 0;
  width: 8px;
  height: 100%;
  background-color: #f0f0f0;
  cursor: pointer;
}

.scrollbar-thumb {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  background-color: #999;
  border-radius: 4px;
  cursor: grab;
}

.scrollbar-thumb:active {
  cursor: grabbing;
}
</style>