import { Button } from "@mui/material";

export default function ActionButton({ children, sx, ...props }) {
  return (
    <Button
      variant="contained"
      {...props}
      sx={{
        ...sx, // Merging external styles
      }}
    >
      {children}
    </Button>
  );
}
