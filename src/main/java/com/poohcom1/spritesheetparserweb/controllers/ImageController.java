package com.poohcom1.spritesheetparserweb.controllers;

import com.poohcom1.spritesheetparser.cv.BlobSequence;
import com.poohcom1.spritesheetparser.image.ImageUtil;
import com.poohcom1.spritesheetparserweb.models.BlobModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;


@CrossOrigin
@RestController
public class ImageController {
    private final AtomicLong id = new AtomicLong();

    @PostMapping("/spritesheet")
    public List<BlobModel> detectBlobs(@RequestParam MultipartFile file,
                             @RequestParam int[] backgroundColors,
                             @RequestParam int distance,
                             @RequestParam int primaryOrder,
                             @RequestParam int secondaryOrder) throws IOException {

        BufferedImage bufferedImage = ImageIO.read(file.getInputStream());

        // Convert image to ABGR if not one
        if (bufferedImage.getType() != BufferedImage.TYPE_4BYTE_ABGR) {
            BufferedImage convertImage = new BufferedImage(bufferedImage.getWidth(), bufferedImage.getHeight(), BufferedImage.TYPE_4BYTE_ABGR);
            Graphics g = convertImage.getGraphics();
            g.drawImage(bufferedImage, 0, 0, null);

            bufferedImage = convertImage;
        }

        if (backgroundColors.length <= 0) {
            backgroundColors = ImageUtil.findBackgroundColor(bufferedImage);
        }

        BlobSequence blobs = new BlobSequence(bufferedImage, backgroundColors, distance, primaryOrder, secondaryOrder);

        List<BlobModel> blobModels = new ArrayList<>();

        blobs.forEach(b -> blobModels.add(new BlobModel(b.x, b.y, b.width, b.height, b.getPoints(), b.getRow(), b.getColumn())));

        System.out.printf("Found %d blobs!\n", blobs.size());

        return blobModels;
    }

    @PostMapping("/crop")
    public ResponseEntity<byte[]> cropImage(@RequestParam MultipartFile file,
                                            @RequestParam int x,
                                            @RequestParam int y,
                                            @RequestParam int w,
                                            @RequestParam int h) throws IOException {
        // Received image
        BufferedImage image = ImageIO.read(file.getInputStream());

        //System.out.printf("x: %d, y: %d, width: %d, height: %d\n", x, y, w, h);

        try {
            image = image.getSubimage(x, y, w, h);
        } catch (Exception e) {
            image = image.getSubimage(x, y, w-1, h-1);
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(image, "png", outputStream);

        return new ResponseEntity<>(outputStream.toByteArray(), HttpStatus.OK);
    }
}
