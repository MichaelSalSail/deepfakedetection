import { Icon } from "@iconify/react";
import closeSquareOutlined from "@iconify/icons-ant-design/close-square-outlined.js";
import questionCircleOutlined from "@iconify/icons-ant-design/question-circle-outlined.js";
import eyeFilled from "@iconify/icons-ant-design/eye-filled.js";
import eyeInvisibleFilled from "@iconify/icons-ant-design/eye-invisible-filled.js";
// material
import { alpha, styled } from "@mui/material/styles/index.js";
import { Card, Typography } from "@mui/material";

// ----------------------------------------------------------------------

const cardLayout = {
  boxShadow: "none",
  textAlign: "center",
  height: "100%",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};

const RootStyle1 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(2, 1),
  color: theme.palette.warning.darker,
  backgroundColor: theme.palette.warning.lighter,
}));

const RootStyle2 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(2, 1),
  color: theme.palette.info.darker,
  backgroundColor: theme.palette.info.lighter,
}));

const RootStyle3 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(2, 1),
  color: theme.palette.primary.darker,
  backgroundColor: theme.palette.primary.lighter,
}));

const RootStyle4 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(2, 1),
  color: theme.palette.error.darker,
  backgroundColor: theme.palette.error.lighter,
}));

const IconWrapperStyle1 = styled("div")(({ theme }) => ({
  margin: "auto",
  display: "flex",
  borderRadius: "50%",
  alignItems: "center",
  width: theme.spacing(5),
  height: theme.spacing(5),
  justifyContent: "center",
  marginBottom: theme.spacing(1),
  color: theme.palette.warning.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(
    theme.palette.warning.dark,
    0
  )} 0%, ${alpha(theme.palette.warning.dark, 0.24)} 100%)`,
}));

const IconWrapperStyle2 = styled("div")(({ theme }) => ({
  margin: "auto",
  display: "flex",
  borderRadius: "50%",
  alignItems: "center",
  width: theme.spacing(5),
  height: theme.spacing(5),
  justifyContent: "center",
  marginBottom: theme.spacing(1),
  color: theme.palette.info.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(
    theme.palette.info.dark,
    0
  )} 0%, ${alpha(theme.palette.info.dark, 0.24)} 100%)`,
}));

const IconWrapperStyle3 = styled("div")(({ theme }) => ({
  margin: "auto",
  display: "flex",
  borderRadius: "50%",
  alignItems: "center",
  width: theme.spacing(5),
  height: theme.spacing(5),
  justifyContent: "center",
  marginBottom: theme.spacing(1),
  color: theme.palette.primary.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(
    theme.palette.primary.dark,
    0
  )} 0%, ${alpha(theme.palette.primary.dark, 0.24)} 100%)`,
}));

const IconWrapperStyle4 = styled("div")(({ theme }) => ({
  margin: "auto",
  display: "flex",
  borderRadius: "50%",
  alignItems: "center",
  width: theme.spacing(5),
  height: theme.spacing(5),
  justifyContent: "center",
  marginBottom: theme.spacing(1),
  color: theme.palette.error.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(
    theme.palette.error.dark,
    0
  )} 0%, ${alpha(theme.palette.error.dark, 0.24)} 100%)`,
}));

// ----------------------------------------------------------------------

export default function Eyeblinks(input) {
  // 4 possible components to represent 4 different eye blink model classifications.
  if(input["color_card"]==="missing")
  {
    return (
      <RootStyle1>
        <IconWrapperStyle1>
          <Icon icon={closeSquareOutlined} width={24} height={24} />
        </IconWrapperStyle1>
        <Typography variant="h5">{input["results"]["models"][1][input["color_card"]]} %</Typography>
        <Typography variant="caption" sx={{ opacity: 0.72, display: "block" }}>
          of frames are missing
        </Typography>
      </RootStyle1>
    );
  }
  else if(input["color_card"]==="unknown")
  {
    return (
      <RootStyle2>
      <IconWrapperStyle2>
        <Icon icon={questionCircleOutlined} width={24} height={24} />
      </IconWrapperStyle2>
      <Typography variant="h5">{input["results"]["models"][1][input["color_card"]]} %</Typography>
      <Typography variant="caption" sx={{ opacity: 0.72, display: "block" }}>
        of frames are unknown
      </Typography>
    </RootStyle2>
    );
  }
  else if(input["color_card"]==="open")
  {
    return (
      <RootStyle3>
        <IconWrapperStyle3>
          <Icon icon={eyeFilled} width={24} height={24} />
        </IconWrapperStyle3>
        <Typography variant="h5">{input["results"]["models"][1][input["color_card"]]} %</Typography>
        <Typography variant="caption" sx={{ opacity: 0.72, display: "block" }}>
          of frames have open eyes
        </Typography>
      </RootStyle3>
    );
  }
  else if(input["color_card"]==="closed")
  {
    return (
      <RootStyle4>
        <IconWrapperStyle4>
          <Icon icon={eyeInvisibleFilled} width={24} height={24} />
        </IconWrapperStyle4>
        <Typography variant="h5">{input["results"]["models"][1][input["color_card"]]} %</Typography>
        <Typography variant="caption" sx={{ opacity: 0.72, display: "block" }}>
          of frames have closed eyes
        </Typography>
      </RootStyle4>
    );
  }
  else
  {
    return (
      <RootStyle1>
        <IconWrapperStyle1>
          <Icon icon={eyeInvisibleFilled} width={24} height={24} />
        </IconWrapperStyle1>
        <Typography variant="h3">{1000} %</Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.99 }}>
          this is an error
        </Typography>
      </RootStyle1>
    );
  }
}
