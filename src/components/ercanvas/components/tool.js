import { Graph, ToolsView } from '@antv/x6';
import { prefix } from '../../../../profile';

const ToolItem = ToolsView.ToolItem;

class EditableCellTool extends ToolItem {
  render() {
    super.render();
    const cell = this.cell;
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;

    const position = cell.position();
    const size = cell.size();
    const pos = this.graph.localToGraph(position);
    const zoom = this.graph.zoom();
    width = size.width * zoom;
    height = size.height * zoom;
    x = pos.x;
    y = pos.y;

    const editorParent = ToolsView.createElement('div', false);
    editorParent.setAttribute('class', `${prefix}-er-editnode`);
    editorParent.style.position = 'absolute';
    editorParent.style.left = `${x}px`;
    editorParent.style.top = `${y}px`;
    editorParent.style.width = `${width}px`;
    editorParent.style.height = `${height}px`;

    this.editorContent = ToolsView.createElement('textarea', false);
    editorParent.appendChild(this.editorContent);
    this.container.appendChild(editorParent);

    this.init();

    return this;
  }

  init = () => {
    const cell = this.cell;
    const value = cell.label;
    if (value) {
      this.editorContent.value = value;
      cell.attr('text/style/display', 'none', { ignoreHistory : true});
    }
    setTimeout(() => {
      if (window.getComputedStyle(this.editorContent).pointerEvents !== 'none') {
        this.editorContent.onblur = (e) => {
          cell.attr('text/text', e.target.value, { ignoreHistory : true});
        };
        this.editorContent.focus();
      }
    });
  }
}

EditableCellTool.config({
  tagName: 'div',
  isSVGElement: false,
});

Graph.registerNodeTool('editableCell', EditableCellTool, true);

