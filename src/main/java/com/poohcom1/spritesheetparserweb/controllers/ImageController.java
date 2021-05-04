package com.poohcom1.spritesheetparserweb.controllers;

import com.poohcom1.spritesheetparser.cv.Blob;
import com.poohcom1.spritesheetparser.cv.BlobSequence;
import com.poohcom1.spritesheetparser.image.ImageUtil;
import com.poohcom1.spritesheetparserweb.models.BlobModel;
import com.poohcom1.spritesheetparserweb.models.PointModel;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;


@CrossOrigin(origins = "http://127.0.0.1:5500", maxAge = 3600)
@RestController
public class ImageController {
    private final AtomicLong id = new AtomicLong();

    @PostMapping("/spritesheet")
    public List<BlobModel> uploadFile(@RequestParam("file") MultipartFile file,
                             @RequestParam int[] backgroundColors,
                             @RequestParam int distance,
                             @RequestParam int primaryOrder,
                             @RequestParam int secondaryOrder) throws IOException {

        BufferedImage bufferedImage = ImageIO.read(file.getInputStream());

        if (backgroundColors.length <= 0) {
            backgroundColors = ImageUtil.findBackgroundColor(bufferedImage);
        }

        BlobSequence blobs = new BlobSequence(bufferedImage, backgroundColors, distance, primaryOrder, secondaryOrder);

        List<BlobModel> blobModels = new ArrayList<>();

        blobs.forEach(b -> blobModels.add(new BlobModel(b.x, b.y, b.width, b.height, b.getPoints(), b.getRow(), b.getColumn())));

        return blobModels;
    }

}
