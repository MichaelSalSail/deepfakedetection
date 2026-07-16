import { Outlet } from "react-router-dom";
// material
import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
// components
import DecorativeBackground from "../../components/DecorativeBackground.js";

// ----------------------------------------------------------------------

const MainStyle = styled("div")(({ theme }) => ({
  position: "relative",
  flexGrow: 1,
  overflow: "auto",
  minHeight: "100%",
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(10),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}));

// ----------------------------------------------------------------------

export default function DashboardLayout() {
  return (
    <MainStyle>
      <DecorativeBackground />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Outlet />
      </Box>
    </MainStyle>
  );
}
