package xyz.goraebap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/** 이 저장소의 조립. 기본 패키지에 있어서 shared와 module 아래의 빈과 설정 값을 모두 찾는다. */
@SpringBootApplication(
        exclude = org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
@EnableScheduling
public class ServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServerApplication.class, args);
    }
}
