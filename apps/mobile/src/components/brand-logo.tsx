import { Image, type ImageStyle, type StyleProp } from "react-native";

const marks = {
  green: require("../../assets/brand/mmemme-stacked-green.png"),
  lime: require("../../assets/brand/mmemme-stacked-lime.png"),
  white: require("../../assets/brand/mmemme-stacked-white.png"),
} as const;

export function BrandLogo({
  treatment = "green",
  style,
}: {
  treatment?: keyof typeof marks;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel="MMEMME"
      resizeMode="contain"
      source={marks[treatment]}
      style={[{ width: 120, height: 58 }, style]}
    />
  );
}
