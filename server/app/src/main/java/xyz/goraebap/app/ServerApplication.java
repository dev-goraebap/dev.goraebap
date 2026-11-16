package xyz.goraebap.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/** 묶은 하위 프로젝트의 빈과 설정 값을 모두 찾도록 공통 패키지에서 훑는다. */
@SpringBootApplication(
        scanBasePackages = "xyz.goraebap",
        exclude = org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan("xyz.goraebap")
@EnableScheduling
public class ServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServerApplication.class, args);
    }
}
