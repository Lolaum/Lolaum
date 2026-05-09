import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let sourceURL = root.appendingPathComponent("public/images/common/LolaumLogo.png")
let iconsDir = root.appendingPathComponent("public/icons", isDirectory: true)
try FileManager.default.createDirectory(at: iconsDir, withIntermediateDirectories: true)

let gold = (r: UInt8(234), g: UInt8(179), b: UInt8(46), a: UInt8(255))
let white = (r: UInt8(255), g: UInt8(255), b: UInt8(255), a: UInt8(255))
let clear = (r: UInt8(255), g: UInt8(255), b: UInt8(255), a: UInt8(0))

guard
  let image = NSImage(contentsOf: sourceURL),
  let tiffData = image.tiffRepresentation,
  let bitmap = NSBitmapImageRep(data: tiffData)
else {
  fatalError("Unable to load source logo at \(sourceURL.path)")
}

let sourceWidth = bitmap.pixelsWide
let sourceHeight = bitmap.pixelsHigh

func maskAlpha(x: Int, y: Int) -> CGFloat {
  guard let color = bitmap.colorAt(x: x, y: y) else { return 0 }
  let red = color.redComponent
  let green = color.greenComponent
  let blue = color.blueComponent

  if red < 0.08 && green < 0.08 && blue < 0.08 {
    return 0
  }

  let yellowStrength = min(red / 0.9, green / 0.68)
  let blackDistance = max(red, green)
  let bluePenalty = max(0, blue - 0.2)
  return max(0, min(1, yellowStrength * blackDistance - bluePenalty))
}

func hasInk(x: Int, y: Int) -> Bool {
  maskAlpha(x: x, y: y) > 0.08
}

func contentBounds(xRange: Range<Int>) -> CGRect {
  var minX = sourceWidth
  var minY = sourceHeight
  var maxX = 0
  var maxY = 0

  for y in 0..<sourceHeight {
    for x in xRange {
      if hasInk(x: x, y: y) {
        minX = min(minX, x)
        minY = min(minY, y)
        maxX = max(maxX, x)
        maxY = max(maxY, y)
      }
    }
  }

  return CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
}

func firstLetterBounds(in fullBounds: CGRect) -> CGRect {
  let minX = Int(fullBounds.minX)
  let rightEdge = min(minX + 112, Int(fullBounds.maxX))
  return contentBounds(xRange: minX..<rightEdge)
}

func writePNG(
  width: Int,
  height: Int,
  background: (r: UInt8, g: UInt8, b: UInt8, a: UInt8),
  sourceRect: CGRect,
  maxArtworkWidth: CGFloat,
  outputURL: URL,
  foreground: (r: UInt8, g: UInt8, b: UInt8, a: UInt8)
) {
  let scale = min(maxArtworkWidth / sourceRect.width, maxArtworkWidth / sourceRect.height)
  let drawWidth = sourceRect.width * scale
  let drawHeight = sourceRect.height * scale
  let drawX = (CGFloat(width) - drawWidth) / 2
  let drawY = (CGFloat(height) - drawHeight) / 2

  var pixels = [UInt8](repeating: 0, count: width * height * 4)

  for y in 0..<height {
    for x in 0..<width {
      let index = (y * width + x) * 4
      pixels[index] = background.r
      pixels[index + 1] = background.g
      pixels[index + 2] = background.b
      pixels[index + 3] = background.a

      let localX = (CGFloat(x) + 0.5 - drawX) / scale + sourceRect.minX
      let localY = (CGFloat(y) + 0.5 - drawY) / scale + sourceRect.minY
      if localX >= sourceRect.minX && localX < sourceRect.maxX &&
        localY >= sourceRect.minY && localY < sourceRect.maxY
      {
        let alpha = maskAlpha(x: Int(localX), y: Int(localY))
        if alpha > 0.01 {
          let sourceAlpha = CGFloat(foreground.a) / 255 * alpha
          let destinationAlpha = CGFloat(background.a) / 255
          let outAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha)

          if outAlpha > 0 {
            let blend = { (src: UInt8, dst: UInt8) -> UInt8 in
              let srcValue = CGFloat(src) / 255
              let dstValue = CGFloat(dst) / 255
              let out = (srcValue * sourceAlpha + dstValue * destinationAlpha * (1 - sourceAlpha)) / outAlpha
              return UInt8(max(0, min(255, round(out * 255))))
            }

            pixels[index] = blend(foreground.r, background.r)
            pixels[index + 1] = blend(foreground.g, background.g)
            pixels[index + 2] = blend(foreground.b, background.b)
            pixels[index + 3] = UInt8(max(0, min(255, round(outAlpha * 255))))
          }
        }
      }
    }
  }

  guard
    let rep = NSBitmapImageRep(
      bitmapDataPlanes: nil,
      pixelsWide: width,
      pixelsHigh: height,
      bitsPerSample: 8,
      samplesPerPixel: 4,
      hasAlpha: true,
      isPlanar: false,
      colorSpaceName: .deviceRGB,
      bytesPerRow: width * 4,
      bitsPerPixel: 32
    ),
    let data = rep.bitmapData
  else {
    fatalError("Unable to create bitmap output")
  }

  _ = pixels.withUnsafeBytes { buffer in
    memcpy(data, buffer.baseAddress!, pixels.count)
  }

  guard let png = rep.representation(using: .png, properties: [:]) else {
    fatalError("Unable to encode PNG")
  }
  try! png.write(to: outputURL)
}

func writeICO(pngURLs: [URL], outputURL: URL) {
  var iconData = Data()
  let pngPayloads = pngURLs.map { try! Data(contentsOf: $0) }
  let headerSize = 6
  let entrySize = 16
  var imageOffset = headerSize + (entrySize * pngPayloads.count)

  func appendUInt16(_ value: UInt16) {
    iconData.append(UInt8(value & 0xff))
    iconData.append(UInt8((value >> 8) & 0xff))
  }

  func appendUInt32(_ value: UInt32) {
    iconData.append(UInt8(value & 0xff))
    iconData.append(UInt8((value >> 8) & 0xff))
    iconData.append(UInt8((value >> 16) & 0xff))
    iconData.append(UInt8((value >> 24) & 0xff))
  }

  appendUInt16(0)
  appendUInt16(1)
  appendUInt16(UInt16(pngPayloads.count))

  for (index, payload) in pngPayloads.enumerated() {
    let size = [16, 32, 48][index]
    iconData.append(UInt8(size))
    iconData.append(UInt8(size))
    iconData.append(0)
    iconData.append(0)
    appendUInt16(1)
    appendUInt16(32)
    appendUInt32(UInt32(payload.count))
    appendUInt32(UInt32(imageOffset))
    imageOffset += payload.count
  }

  for payload in pngPayloads {
    iconData.append(payload)
  }

  try! iconData.write(to: outputURL)
}

let wordmarkBounds = contentBounds(xRange: 0..<sourceWidth)
let letterBounds = firstLetterBounds(in: wordmarkBounds)

writePNG(width: 16, height: 16, background: gold, sourceRect: letterBounds, maxArtworkWidth: 11, outputURL: iconsDir.appendingPathComponent("favicon-16x16.png"), foreground: white)
writePNG(width: 32, height: 32, background: gold, sourceRect: letterBounds, maxArtworkWidth: 23, outputURL: iconsDir.appendingPathComponent("favicon-32x32.png"), foreground: white)
writePNG(width: 48, height: 48, background: gold, sourceRect: letterBounds, maxArtworkWidth: 34, outputURL: iconsDir.appendingPathComponent("favicon-48x48.png"), foreground: white)
writeICO(
  pngURLs: [
    iconsDir.appendingPathComponent("favicon-16x16.png"),
    iconsDir.appendingPathComponent("favicon-32x32.png"),
    iconsDir.appendingPathComponent("favicon-48x48.png"),
  ],
  outputURL: root.appendingPathComponent("public/favicon.ico")
)

writePNG(width: 180, height: 180, background: gold, sourceRect: wordmarkBounds, maxArtworkWidth: 132, outputURL: root.appendingPathComponent("public/apple-touch-icon.png"), foreground: white)
writePNG(width: 192, height: 192, background: gold, sourceRect: wordmarkBounds, maxArtworkWidth: 128, outputURL: iconsDir.appendingPathComponent("icon-192x192.png"), foreground: white)
writePNG(width: 192, height: 192, background: gold, sourceRect: wordmarkBounds, maxArtworkWidth: 128, outputURL: root.appendingPathComponent("public/icon-192.png"), foreground: white)
writePNG(width: 512, height: 512, background: gold, sourceRect: wordmarkBounds, maxArtworkWidth: 336, outputURL: iconsDir.appendingPathComponent("icon-512x512.png"), foreground: white)
writePNG(width: 512, height: 512, background: gold, sourceRect: wordmarkBounds, maxArtworkWidth: 336, outputURL: root.appendingPathComponent("public/icon-512.png"), foreground: white)
writePNG(width: 512, height: 512, background: gold, sourceRect: wordmarkBounds, maxArtworkWidth: 320, outputURL: iconsDir.appendingPathComponent("maskable-512x512.png"), foreground: white)

writePNG(width: 960, height: 260, background: clear, sourceRect: wordmarkBounds, maxArtworkWidth: 760, outputURL: root.appendingPathComponent("public/images/common/LolaumLogoWeb.png"), foreground: gold)

print("Generated Lolaum icons from first uppercase L and full wordmark")
