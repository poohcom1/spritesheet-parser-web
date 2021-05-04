package com.poohcom1.spritesheetparserweb.models;

import java.awt.*;
import java.util.List;

public class BlobModel {
    private final int x1;
    private final int x2;
    private final int y1;
    private final int y2;

    private final int row;
    private final int col;

    private final List<Point> points;

    public BlobModel(int x1, int y1, int x2, int y2, List<Point> points, int row, int col) {
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;

        this.row = row;
        this.col = col;

        this.points = points;
    }

    public int getX1() {
        return x1;
    }

    public int getX2() {
        return x2;
    }

    public int getY1() {
        return y1;
    }

    public int getY2() {
        return y2;
    }


    public int getRow() {
        return row;
    }

    public int getCol() {
        return col;
    }

    public List<Point> getPoints() {
        return points;
    }
}
