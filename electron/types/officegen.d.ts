declare module 'officegen' {
  interface DocxParagraph {
    addText(text: string): void
  }

  interface DocxDocument {
    createP(): DocxParagraph
    generate(output: any): void
  }

  function officegen(type: string): DocxDocument
  export = officegen
}
