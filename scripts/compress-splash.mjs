import sharp from "sharp";

const files = ["assets/splash.png", "assets/splash-dark.png"];

for (const file of files) {
  const before = (await sharp(file).metadata()).size;
  await sharp(file)
    .png({ palette: true, quality: 80, compressionLevel: 9 })
    .toFile(file + ".tmp");

  const fs = await import("node:fs/promises");
  await fs.rename(file + ".tmp", file);

  console.log(`${file}: compressed`);
}