package com.poohcom1.spritesheetparserweb.controllers;

import com.poohcom1.spritesheetparser.cv.BlobSequence;
import com.poohcom1.spritesheetparser.image.ImageUtil;
import com.poohcom1.spritesheetparserweb.models.BlobModel;
import com.poohcom1.spritesheetparserweb.models.BlobSequenceModel;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;


@CrossOrigin(origins = "http://localhost:63343")
@RestController
public class ImageController {
    AtomicLong ids = new AtomicLong();

    @PostMapping("/spritesheet")
    public BlobSequenceModel detectBlobs(@RequestParam MultipartFile file,
                                         @RequestParam int[] backgroundColors,
                                         @RequestParam int distance,
                                         @RequestParam int count,
                                         @RequestParam int deltaThreshold,
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

        while (blobs.size() == count && distance > 2 && blobs.size() > 2) {
            distance += deltaThreshold;

            blobs = new BlobSequence(bufferedImage, backgroundColors, distance, primaryOrder, secondaryOrder);
        }

        List<BlobModel> blobModels = new ArrayList<>();

        blobs.forEach(b -> blobModels.add(new BlobModel(b.x, b.y, b.width, b.height, b.getPoints(), b.getRow(), b.getColumn())));

        System.out.printf("Found %d blobs!\n", blobs.size());

        return new BlobSequenceModel(ids.getAndIncrement(), blobModels, distance);
    }
}
