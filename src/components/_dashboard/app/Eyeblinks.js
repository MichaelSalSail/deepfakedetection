import { Icon } from "@iconify/react";
import closeSquareOutlined from "@iconify/icons-ant-design/close-square-outlined.js";
import questionCircleOutlined from "@iconify/icons-ant-design/question-circle-outlined.js";
import eyeFilled from "@iconify/icons-ant-design/eye-filled.js";
import eyeInvisibleFilled from "@iconify/icons-ant-design/eye-invisible-filled.js";
// material
import { alpha, styled } from "@mui/material/styles/index.js";
import { Box, Card, Typography } from "@mui/material";
import { BLINK_OPEN, BLINK_CLOSED } from "../../../utils/blinkClassification.js";

// ----------------------------------------------------------------------

// Longest subtext: "closed eyes" — single-line at caption size; row 1 fits icon + "100.00 %"
export const BLINK_CARD_MIN_WIDTH = 144;
// Point label card: fits icon row + detail text with minimal horizontal padding
export const BLINK_POINT_CARD_WIDTH = 152;
// Shared row height for the 4-card stack and the timeline chart beside it
export const BLINK_TIMELINE_ROW_HEIGHT = 252;

export const BLINK_CARDS_ORDER = ["open", "closed", "unknown", "missing"];

const cardLayout = {
  boxShadow: "none",
  height: "100%",
  width: "100%",
  minWidth: BLINK_CARD_MIN_WIDTH,
  position: "relative",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};

const RootStyle1 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(0.75, 1),
  color: theme.palette.error.darker,
  backgroundColor: theme.palette.error.lighter,
}));

const RootStyle2 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(0.75, 1),
  color: theme.palette.error.dark,
  backgroundColor: alpha(theme.palette.error.light, 0.35),
}));

const RootStyle3 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(0.75, 1),
  color: BLINK_OPEN.darker,
  backgroundColor: BLINK_OPEN.lighter,
}));

const RootStyle4 = styled(Card)(({ theme }) => ({
  ...cardLayout,
  padding: theme.spacing(0.75, 1),
  color: BLINK_CLOSED.darker,
  backgroundColor: BLINK_CLOSED.lighter,
}));

const IconWrapperStyle1 = styled("div")(({ theme }) => ({
  display: "flex",
  borderRadius: "50%",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: theme.spacing(4),
  height: theme.spacing(4),
  color: theme.palette.error.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.error.dark, 0)} 0%, ${alpha(theme.palette.error.dark, 0.24)} 100%)`,
}));

const IconWrapperStyle2 = styled("div")(({ theme }) => ({
  display: "flex",
  borderRadius: "50%",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: theme.spacing(4),
  height: theme.spacing(4),
  color: theme.palette.error.main,
  backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0)} 0%, ${alpha(theme.palette.error.main, 0.2)} 100%)`,
}));

const IconWrapperStyle3 = styled("div")(({ theme }) => ({
  display: "flex",
  borderRadius: "50%",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: theme.spacing(4),
  height: theme.spacing(4),
  color: BLINK_OPEN.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(BLINK_OPEN.dark, 0)} 0%, ${alpha(BLINK_OPEN.dark, 0.24)} 100%)`,
}));

const IconWrapperStyle4 = styled("div")(({ theme }) => ({
  display: "flex",
  borderRadius: "50%",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: theme.spacing(4),
  height: theme.spacing(4),
  color: BLINK_CLOSED.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(BLINK_CLOSED.dark, 0)} 0%, ${alpha(BLINK_CLOSED.dark, 0.24)} 100%)`,
}));

const BLINK_CARD_CONFIG = {
  missing: {
    Root: RootStyle1,
    IconWrapper: IconWrapperStyle1,
    icon: closeSquareOutlined,
    classification: -2,
    subtext: "missing",
  },
  unknown: {
    Root: RootStyle2,
    IconWrapper: IconWrapperStyle2,
    icon: questionCircleOutlined,
    classification: -1,
    subtext: "unknown",
  },
  open: {
    Root: RootStyle3,
    IconWrapper: IconWrapperStyle3,
    icon: eyeFilled,
    classification: 2,
    subtext: "open eyes",
  },
  closed: {
    Root: RootStyle4,
    IconWrapper: IconWrapperStyle4,
    icon: eyeInvisibleFilled,
    classification: 1,
    subtext: "closed eyes",
  },
};

function BlinkCard({ results, colorCard }) {
  const config = BLINK_CARD_CONFIG[colorCard];
  if (!config) {
    return (
      <RootStyle1>
        <IconWrapperStyle1>
          <Icon icon={eyeInvisibleFilled} width={20} height={20} />
        </IconWrapperStyle1>
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
          top: 6,
          right: 8,
          fontWeight: 700,
          fontFamily: "Monospace",
          opacity: 0.75,
          lineHeight: 1,
        }}
      >
        {classification}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.75,
          mb: 0.25,
          whiteSpace: "nowrap",
        }}
      >
        <IconWrapper>
          <Icon icon={icon} width={20} height={20} />
        </IconWrapper>
        <Typography variant="h6" sx={{ lineHeight: 1, whiteSpace: "nowrap" }}>
          {percent} %
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{ opacity: 0.72, display: "block", whiteSpace: "nowrap", px: 0.25 }}
      >
        {subtext}
      </Typography>
    </Root>
  );
}

// ----------------------------------------------------------------------

export function BlinkCardsStack({ results }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: BLINK_TIMELINE_ROW_HEIGHT,
        minHeight: BLINK_TIMELINE_ROW_HEIGHT,
        width: { xs: "100%", md: BLINK_CARD_MIN_WIDTH },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{ display: "block", mb: 0.5, lineHeight: 1.2, flexShrink: 0 }}
      >
        (% of total frames)
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          flex: 1,
          minHeight: 0,
        }}
      >
        {BLINK_CARDS_ORDER.map((colorCard) => (
          <Box key={colorCard} sx={{ flex: 1, display: "flex", minHeight: 0 }}>
            <BlinkCard results={results} colorCard={colorCard} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function Eyeblinks(input) {
  return (
    <BlinkCard results={input["results"]} colorCard={input["color_card"]} />
  );
}
