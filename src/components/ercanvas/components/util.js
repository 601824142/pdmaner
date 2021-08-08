export const renderer = {
  heading(text, level, raw, slugger) {
    if (this.options.headerIds) {
      return `<h${
         level
         } style="margin: 5px" id="${
         this.options.headerPrefix
         }${slugger.slug(raw)
         }">${
         text
         }</h${
         level
         }>\n`;
    }
    // ignore IDs
    return `<h${level} style="margin: 5px">${text}</h${level}>\n`;
  },
  paragraph(text) {
    return `<p style="margin: 5px">${text}</p>`;
  },
  hr(){
    return '<hr style="margin: 0;border-style: solid;color: #F2F5F6" size="1px"/>';
  },
  list(body, ordered, start) {
    const type = ordered ? 'ol' : 'ul',
      startatt = (ordered && start !== 1) ? (` start="${start}"`) : '';
    return `<${type}${startatt} style="text-align: left;margin: 0px 0px 0px 20px;padding: 0px;line-height: 10px;${ordered ? '' : 'list-style: circle'}">\n${body}</${type}>\n`;
  },
};
