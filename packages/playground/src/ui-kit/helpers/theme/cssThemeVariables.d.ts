import "@mui/material/styles";

// The theme uses CSS variables, so the ThemeProvider takes the props of that mode, such as colorSchemeNode
declare module "@mui/material/styles" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Declaration merging needs an interface
  interface CssThemeVariables {
    enabled: true;
  }
}
