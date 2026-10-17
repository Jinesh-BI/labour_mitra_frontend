import Box, { type BoxProps } from "@mui/material/Box";

/** Content rises and fades in; `index` staggers siblings (capped so long lists do not feel slow). */
export function Rise({ index = 0, sx, ...rest }: BoxProps & { index?: number }) {
  return (
    <Box
      {...rest}
      sx={[
        { animation: "lm-rise .45s cubic-bezier(.2,.8,.2,1) backwards", animationDelay: `${Math.min(index, 8) * 55}ms` },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
