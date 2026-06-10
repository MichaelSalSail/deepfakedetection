import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { alpha, Box, Card, CardContent, Typography } from "@mui/material";

const GEMINI_LOGO_URL = "/static/gemini-logo.png";

// ----------------------------------------------------------------------

function FramePlaceholder({ label, variant = "scene" }) {
  const isScene = variant === "scene";

  const outerBoxSx = {
    flex: 1,
    minHeight: 88,
    width: "100%",
    borderRadius: 1.5,
    bgcolor: "common.white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 0.5,
    px: 1,
  };

  const dashedBorderSx = {
    border: "1px dashed",
    borderColor: (theme) => alpha(theme.palette.info.main, 0.45),
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        alignItems: "stretch",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight="medium"
        sx={{ mb: 0.5, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      {isScene ? (
        <Box sx={{ ...outerBoxSx, ...dashedBorderSx }}>
          <ImageOutlinedIcon
            sx={{
              fontSize: 28,
              color: (theme) => alpha(theme.palette.info.dark, 0.5),
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{ lineHeight: 1.3, fontSize: "0.7rem" }}
          >
            Full video frame
          </Typography>
        </Box>
      ) : (
        <Box sx={outerBoxSx}>
          <Box
            sx={{
              width: 72,
              height: 72,
              flexShrink: 0,
              borderRadius: 1.5,
              ...dashedBorderSx,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              px: 1,
            }}
          >
            <ImageOutlinedIcon
              sx={{
                fontSize: 20,
                color: (theme) => alpha(theme.palette.info.dark, 0.5),
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ lineHeight: 1.3, fontSize: "0.65rem" }}
            >
              Subject crop
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function GeminiFrameAnalysis() {
  return (
    <Card
      sx={{
        width: "100%",
        bgcolor: (theme) => alpha(theme.palette.info.light, 0.35),
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.info.main, 0.35),
        boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.info.main, 0.12)}`,
      }}
    >
      <CardContent sx={{ py: 2, px: 2, "&:last-child": { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 2, md: 2.5 },
            alignItems: "stretch",
            minHeight: { md: 220 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              flexShrink: 0,
              width: { xs: "100%", md: 148 },
              px: { xs: 0, md: 0.5 },
            }}
          >
            <Box
              component="img"
              src={GEMINI_LOGO_URL}
              alt="Google Gemini"
              sx={{
                width: 56,
                height: 56,
                objectFit: "contain",
                mb: 1.5,
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                lineHeight: 1.2,
                color: "info.darker",
                fontSize: { xs: "1.35rem", md: "1.45rem" },
              }}
            >
              Gemini Frame Analysis
            </Typography>
            <Typography
              variant="caption"
              color="info.dark"
              fontWeight="medium"
              sx={{ mt: 0.75, display: "block", lineHeight: 1.35 }}
            >
              Powered by Google Gemini AI
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              flexShrink: 0,
              width: { xs: "100%", md: 176 },
              minHeight: { md: 220 },
            }}
          >
            <FramePlaceholder label="Subject" variant="subject" />
            <FramePlaceholder label="Scene" variant="scene" />
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              borderRadius: 1.5,
              bgcolor: "common.white",
              border: "1px solid",
              borderColor: (theme) => alpha(theme.palette.info.main, 0.2),
              px: 2,
              py: 1.5,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              Gemini AI output
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontStyle: "italic",
                lineHeight: 1.65,
                opacity: 0.72,
              }}
            >
              Gemini will review the full scene frame and the cropped subject frame to describe
              what it sees — setting, eyewear reflections, facial details, and signs of
              manipulation or AI generation. Results will appear here after analysis.
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
