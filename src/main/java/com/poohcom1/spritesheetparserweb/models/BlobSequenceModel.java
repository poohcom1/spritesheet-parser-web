package com.poohcom1.spritesheetparserweb.models;

import java.util.List;

public class BlobSequenceModel {
    private final long id;
    private final List<BlobModel> blobs;
    private final int threshold;

    public BlobSequenceModel(long id, List<BlobModel> blobs, int threshold) {
        this.id = id;
        this.blobs = blobs;
        this.threshold = threshold;
    }

    public long getId() {
        return id;
    }

    public List<BlobModel> getBlobs() {
        return blobs;
    }

    public int getThreshold() {
        return threshold;
    }
}
