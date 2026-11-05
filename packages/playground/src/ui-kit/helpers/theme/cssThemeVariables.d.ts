import "@mui/material/styles";

// The theme uses CSS variables, so the ThemeProvider takes the props of that mode, such as colorSchemeNode
declare module "@mui/material/styles" {
  interface CssThemeVariables {
    enabled: true;
  }
}
