package com.poohcom1.spritesheetparserweb.controllers;

import com.poohcom1.spritesheetparserweb.models.Greeting;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.atomic.AtomicLong;


@CrossOrigin(origins = "http://127.0.0.1:5500", maxAge = 3600)
@Controller
public class PageController {
    private final String template = "Hello";
    private final AtomicLong counter = new AtomicLong();

    @GetMapping("/uploader")
    public String uploader() {
        return "uploader.html";
    }
}
