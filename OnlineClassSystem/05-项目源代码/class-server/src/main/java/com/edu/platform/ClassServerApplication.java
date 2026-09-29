package com.edu.platform;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.edu.platform.mapper")
public class ClassServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClassServerApplication.class, args);
    }
}
