// CSS module declarations
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

// Katex CSS
declare module 'katex/dist/katex.min.css'
