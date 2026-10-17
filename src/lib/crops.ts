// Crop emoji and deep colours are not in the API (see the connection spec, known gaps); they come from the prototype.
type CropLook = { emoji: string; color: string };

const looks: Record<string, CropLook> = {
  grape: { emoji: "🍇", color: "#5A2A80" },
  onion: { emoji: "🧅", color: "#97405F" },
  pomegranate: { emoji: "🍎", color: "#A4161A" },
};

export const cropLook = (name: string): CropLook => looks[name.trim().toLowerCase()] ?? { emoji: "🌱", color: "#1E6B3B" };
