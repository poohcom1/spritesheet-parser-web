package com.poohcom1.spritesheetparserweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.CrossOrigin;

@CrossOrigin(origins = "http://127.0.0.1:5500", maxAge = 3600)
@SpringBootApplication
public class SpritesheetParserWebApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpritesheetParserWebApplication.class, args);
	}

}
