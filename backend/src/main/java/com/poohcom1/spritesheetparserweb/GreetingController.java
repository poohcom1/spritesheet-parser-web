package com.poohcom1.spritesheetparserweb;

import org.springframework.web.bind.annotation.*;

import java.util.concurrent.atomic.AtomicLong;


@CrossOrigin(origins = "http://127.0.0.1:5500", maxAge = 3600)
@RestController
public class GreetingController {
    private final String template = "Hello";
    private final AtomicLong counter = new AtomicLong();

    @GetMapping("/greeting")
    public Greeting greeting(@RequestParam(value = "name", defaultValue = "World") String name) {
        return new Greeting(counter.incrementAndGet(), String.format("%s %s!", template, name));
    }


    @PostMapping("/fizzbuzz")
    public String receiveGreeting(@RequestBody String request) {
        int n = Integer.parseInt(request);
        StringBuilder text = new StringBuilder();
        for (int i = 0; i < n; i++) {
            String fb = "";
            if (i % 3 == 0)  fb += "Fizz";
            if (i % 5 == 0) fb += "Buzz";
            if (fb.equals("")) fb = "" + i;
            text.append(fb).append("\n");
        }


        System.out.println(text);
        return text.toString();
    }

}
