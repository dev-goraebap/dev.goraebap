package xyz.goraebap.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** 묶은 하위 프로젝트의 빈을 모두 찾도록 공통 패키지에서 훑는다. */
@SpringBootApplication(scanBasePackages = "xyz.goraebap")
public class ServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServerApplication.class, args);
    }
}
