package com.poohcom1.spritesheetparserweb.models;

import java.awt.*;
import java.util.List;

public class BlobModel {
    private final int x;
    private final int y;
    private final int width;
    private final int height;

    private final List<Point> points;

    private final int row;
    private final int col;

    public BlobModel(int x, int y, int width, int height, List<Point> points, int row, int col) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.row = row;
        this.col = col;
        this.points = points;
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public List<Point> getPoints() {
        return points;
    }

    public int getRow() {
        return row;
    }

    public int getCol() {
        return col;
    }
}
