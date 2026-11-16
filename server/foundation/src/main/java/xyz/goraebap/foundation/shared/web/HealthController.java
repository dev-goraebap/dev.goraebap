package xyz.goraebap.foundation.shared.web;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** 서버가 떠 있는지 알리는 공개 주소. 설치에 관한 정보는 담지 않는다. */
@RestController
class HealthController {

    @GetMapping(value = "/api/v1/health", produces = "application/json")
    Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
