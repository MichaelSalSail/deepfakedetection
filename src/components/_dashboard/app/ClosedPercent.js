import { Icon } from "@iconify/react";
import eyeInvisibleFilled from "@iconify/icons-ant-design/eye-invisible-filled.js";
// material
import { alpha, styled } from "@mui/material/styles/index.js";
import { Card, Typography } from "@mui/material";
// utils
import { fShortenNumber } from "../../../utils/formatNumber.js";
import { extract_percents } from "../../../utils/AllResults.js";

// ----------------------------------------------------------------------

const RootStyle = styled(Card)(({ theme }) => ({
  boxShadow: "none",
  textAlign: "center",
  padding: theme.spacing(5, 0),
  color: theme.palette.error.darker,
  backgroundColor: theme.palette.error.lighter,
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
  color: theme.palette.error.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(
    theme.palette.error.dark,
    0
  )} 0%, ${alpha(theme.palette.error.dark, 0.24)} 100%)`,
}));

// ----------------------------------------------------------------------

export default function ClosedPercent() {
  const renderPercentage = () => {
    let eyes_result = require('../../../pages/AllResultsJSON/result_blink.json');
    return eyes_result["closed"];
  };

  return (
    <RootStyle>
      <IconWrapperStyle>
        <Icon icon={eyeInvisibleFilled} width={24} height={24} />
      </IconWrapperStyle>
      <Typography variant="h3">{renderPercentage()} %</Typography>
      <Typography variant="subtitle2" sx={{ opacity: 0.72 }}>
        of frames have closed eyes
      </Typography>
    </RootStyle>
  );
}
