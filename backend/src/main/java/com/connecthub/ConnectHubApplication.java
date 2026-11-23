package com.connecthub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ConnectHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConnectHubApplication.class, args);
    }
}
