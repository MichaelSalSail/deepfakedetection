import { Icon } from "@iconify/react";
import closeSquareOutlined from "@iconify/icons-ant-design/close-square-outlined";
// material
import { alpha, styled } from "@mui/material/styles";
import { Card, Typography } from "@mui/material";
// utils
import { fShortenNumber } from "../../../utils/formatNumber";

// ----------------------------------------------------------------------

const RootStyle = styled(Card)(({ theme }) => ({
  boxShadow: "none",
  textAlign: "center",
  padding: theme.spacing(5, 0),
  color: theme.palette.warning.darker,
  backgroundColor: theme.palette.warning.lighter,
}));

const IconWrapperStyle = styled("div")(({ theme }) => ({
  margin: "auto",
  display: "flex",
  borderRadius: "50%",
  alignItems: "center",
  width: theme.spacing(8),
  height: theme.spacing(8),
  justifyContent: "center",
  marginBottom: theme.spacing(3),
  color: theme.palette.warning.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(
    theme.palette.warning.dark,
    0
  )} 0%, ${alpha(theme.palette.warning.dark, 0.24)} 100%)`,
}));

// ----------------------------------------------------------------------

const TOTAL = 1723315;

export default function AppItemOrders({
  missingFrames,
  unknownFrames,
  openedFrames,
  closedFrames,
}) {
  const renderPercentage = () => {
    let total = missingFrames + unknownFrames + openedFrames + closedFrames;
    let percent = ((missingFrames / total) * 100).toFixed(2);
    return percent;
  };

  return (
    <RootStyle>
      <IconWrapperStyle>
        <Icon icon={closeSquareOutlined} width={24} height={24} />
      </IconWrapperStyle>
      <Typography variant="h3">{renderPercentage()} %</Typography>
      <Typography variant="subtitle2" sx={{ opacity: 0.72 }}>
        Missing Frames
      </Typography>
    </RootStyle>
  );
}
