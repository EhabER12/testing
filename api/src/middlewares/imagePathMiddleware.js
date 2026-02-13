import path from "path";
import dotenv from "dotenv";
dotenv.config();

export const imagePathMiddleware = (req, res, next) => {
  const originalSend = res.json;

  res.json = function (body) {
    if (body && body.success) {
      const visited = new WeakSet();
      processImagePaths(body, visited);
    }

    return originalSend.call(this, body);
  };

  next();
};

const processImagePaths = (data, visited = new WeakSet()) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";

  if (data === null || typeof data !== "object") {
    return;
  }

  if (visited.has(data)) {
    return;
  }

  visited.add(data);

  if (Array.isArray(data)) {
    data.forEach((item) => processImagePaths(item, visited));
  } else if (data && typeof data === "object") {
    if (data.image && typeof data.image === "string") {
      if (data.image.startsWith("/uploads")) {
        data.image = `${baseUrl}${data.image}`;
      } else if (data.image.includes(":\\") || data.image.includes("/")) {
        const filename = path.basename(data.image);
        data.image = `${baseUrl}/uploads/${filename}`;
      }
    }

    if (data.imageUrl && typeof data.imageUrl === "string") {
      if (data.imageUrl.startsWith("/uploads")) {
        data.imageUrl = `${baseUrl}${data.imageUrl}`;
      } else if (data.imageUrl.includes(":\\") || data.imageUrl.includes("/")) {
        const filename = path.basename(data.imageUrl);
        data.imageUrl = `${baseUrl}/uploads/${filename}`;
      }
    }

    if (data.paymentProofUrl && typeof data.paymentProofUrl === "string") {
      if (data.paymentProofUrl.startsWith("/uploads")) {
        data.paymentProofUrl = `${baseUrl}${data.paymentProofUrl}`;
      } else if (data.paymentProofUrl.startsWith("uploads/")) {
        data.paymentProofUrl = `${baseUrl}/${data.paymentProofUrl}`;
      } else if (
        data.paymentProofUrl.includes(":\\") ||
        data.paymentProofUrl.includes("/")
      ) {
        const filename = path.basename(data.paymentProofUrl);
        data.paymentProofUrl = `${baseUrl}/uploads/${filename}`;
      }
    }

    if (data.payoutProofUrl && typeof data.payoutProofUrl === "string") {
      if (data.payoutProofUrl.startsWith("/uploads")) {
        data.payoutProofUrl = `${baseUrl}${data.payoutProofUrl}`;
      } else if (data.payoutProofUrl.startsWith("uploads/")) {
        data.payoutProofUrl = `${baseUrl}/${data.payoutProofUrl}`;
      } else if (
        data.payoutProofUrl.includes(":\\") ||
        data.payoutProofUrl.includes("/")
      ) {
        const filename = path.basename(data.payoutProofUrl);
        data.payoutProofUrl = `${baseUrl}/uploads/${filename}`;
      }
    }

    if (data.logo && typeof data.logo === "string") {
      if (data.logo.startsWith("/uploads")) {
        data.logo = `${baseUrl}${data.logo}`;
      } else if (data.logo.includes(":\\") || data.logo.includes("/")) {
        const filename = path.basename(data.logo);
        data.logo = `${baseUrl}/uploads/${filename}`;
      }
    }
    if (data.favicon && typeof data.favicon === "string") {
      if (data.favicon.startsWith("/uploads")) {
        data.favicon = `${baseUrl}${data.favicon}`;
      } else if (data.favicon.includes(":\\") || data.favicon.includes("/")) {
        const filename = path.basename(data.favicon);
        data.favicon = `${baseUrl}/uploads/${filename}`;
      }
    }

    // Handle article coverImage
    if (data.coverImage && typeof data.coverImage === "string") {
      if (data.coverImage.startsWith("/uploads")) {
        data.coverImage = `${baseUrl}${data.coverImage}`;
      } else if (
        data.coverImage.includes(":\\") ||
        (data.coverImage.includes("/") && !data.coverImage.startsWith("http"))
      ) {
        const filename = path.basename(data.coverImage);
        data.coverImage = `${baseUrl}/uploads/${filename}`;
      }
    }

    // Handle article heroImage
    if (data.heroImage && typeof data.heroImage === "string") {
      if (data.heroImage.startsWith("/uploads")) {
        data.heroImage = `${baseUrl}${data.heroImage}`;
      } else if (
        data.heroImage.includes(":\\") ||
        (data.heroImage.includes("/") && !data.heroImage.startsWith("http"))
      ) {
        const filename = path.basename(data.heroImage);
        data.heroImage = `${baseUrl}/uploads/${filename}`;
      }
    }

    if (data.results && Array.isArray(data.results)) {
      data.results.forEach((item) => {
        if (item.image && typeof item.image === "string") {
          if (item.image.startsWith("/uploads")) {
            item.image = `${baseUrl}${item.image}`;
          } else if (item.image.includes(":\\") || item.image.includes("/")) {
            const filename = path.basename(item.image);
            item.image = `${baseUrl}/uploads/${filename}`;
          }
        }

        if (item.images && Array.isArray(item.images)) {
          item.images = item.images.map((imagePath) => {
            if (typeof imagePath === "string") {
              if (imagePath.startsWith("/uploads")) {
                return `${baseUrl}${imagePath}`;
              } else if (imagePath.includes(":\\") || imagePath.includes("/")) {
                const filename = path.basename(imagePath);
                return `${baseUrl}/uploads/${filename}`;
              }
            }
            return imagePath;
          });
        }

        processImagePaths(item, visited);
      });
    }

    Object.keys(data).forEach((key) => {
      if (
        data[key] &&
        typeof data[key] === "object" &&
        !visited.has(data[key])
      ) {
        processImagePaths(data[key], visited);
      } else if (
        typeof data[key] === "string" &&
        data[key].startsWith("/uploads")
      ) {
        data[key] = `${baseUrl}${data[key]}`;
      }
    });
  }
};
