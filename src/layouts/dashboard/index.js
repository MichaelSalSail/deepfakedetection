import { Outlet } from "react-router-dom";
// material
import { styled } from "@mui/material/styles";

// ----------------------------------------------------------------------

const MainStyle = styled("div")(({ theme }) => ({
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
      <Outlet />
    </MainStyle>
  );
}
