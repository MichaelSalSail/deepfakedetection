import { Icon } from "@iconify/react";
import closeSquareOutlined from "@iconify/icons-ant-design/close-square-outlined.js";
import questionCircleOutlined from "@iconify/icons-ant-design/question-circle-outlined.js";
import eyeFilled from "@iconify/icons-ant-design/eye-filled.js";
import eyeInvisibleFilled from "@iconify/icons-ant-design/eye-invisible-filled.js";
// material
import { alpha, styled } from "@mui/material/styles/index.js";
import { Card, Typography } from "@mui/material";

// ----------------------------------------------------------------------

export const BLINK_CARD_MIN_WIDTH = 200;

const cardLayout = {
  boxShadow: "none",
  textAlign: "center",
  height: "100%",
  width: "100%",
  minWidth: BLINK_CARD_MIN_WIDTH,
  position: "relative",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};

const BLINK_OPEN = {
  lighter: "#F3E8FF",
  dark: "#6D28D9",
  darker: "#5B21B6",
};

const BLINK_CLOSED = {
  lighter: "#EEF2FF",
  dark: "#4338CA",
  darker: "#312E81",
};

const RootStyle1 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(2, 1),
  color: theme.palette.error.darker,
  backgroundColor: theme.palette.error.lighter,
}));

const RootStyle2 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(2, 1),
  color: theme.palette.error.dark,
  backgroundColor: alpha(theme.palette.error.light, 0.35),
}));

const RootStyle3 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(2, 1),
  color: BLINK_OPEN.darker,
  backgroundColor: BLINK_OPEN.lighter,
}));

const RootStyle4 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(2, 1),
  color: BLINK_CLOSED.darker,
  backgroundColor: BLINK_CLOSED.lighter,
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
  color: theme.palette.error.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(
    theme.palette.error.dark,
    0
  )} 0%, ${alpha(theme.palette.error.dark, 0.24)} 100%)`,
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
  color: theme.palette.error.main,
  backgroundImage: `linear-gradient(135deg, ${alpha(
    theme.palette.error.main,
    0
  )} 0%, ${alpha(theme.palette.error.main, 0.2)} 100%)`,
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
  color: BLINK_OPEN.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(BLINK_OPEN.dark, 0)} 0%, ${alpha(BLINK_OPEN.dark, 0.24)} 100%)`,
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
  color: BLINK_CLOSED.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(BLINK_CLOSED.dark, 0)} 0%, ${alpha(BLINK_CLOSED.dark, 0.24)} 100%)`,
}));

const BLINK_CARD_CONFIG = {
  missing: {
    Root: RootStyle1,
    IconWrapper: IconWrapperStyle1,
    icon: closeSquareOutlined,
    classification: -2,
    subtext: "of frames are missing",
  },
  unknown: {
    Root: RootStyle2,
    IconWrapper: IconWrapperStyle2,
    icon: questionCircleOutlined,
    classification: -1,
    subtext: "of frames are unknown",
  },
  open: {
    Root: RootStyle3,
    IconWrapper: IconWrapperStyle3,
    icon: eyeFilled,
    classification: 2,
    subtext: "of frames have open eyes",
  },
  closed: {
    Root: RootStyle4,
    IconWrapper: IconWrapperStyle4,
    icon: eyeInvisibleFilled,
    classification: 1,
    subtext: "of frames have closed eyes",
  },
};

function BlinkCard({ results, colorCard }) {
  const config = BLINK_CARD_CONFIG[colorCard];
  if (!config) {
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

  const { Root, IconWrapper, icon, classification, subtext } = config;
  const percent = results["models"][1][colorCard];

  return (
    <Root>
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          top: 8,
          right: 10,
          fontWeight: 700,
          fontFamily: "Monospace",
          opacity: 0.75,
          lineHeight: 1,
        }}
      >
        {classification}
      </Typography>
      <IconWrapper>
        <Icon icon={icon} width={24} height={24} />
      </IconWrapper>
      <Typography variant="h5">{percent} %</Typography>
      <Typography
        variant="caption"
        sx={{ opacity: 0.72, display: "block", whiteSpace: "nowrap", px: 0.5 }}
      >
        {subtext}
      </Typography>
    </Root>
  );
}

// ----------------------------------------------------------------------

export default function Eyeblinks(input) {
  return (
    <BlinkCard results={input["results"]} colorCard={input["color_card"]} />
  );
}
