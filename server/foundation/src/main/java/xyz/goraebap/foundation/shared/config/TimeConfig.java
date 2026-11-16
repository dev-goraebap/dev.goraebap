package xyz.goraebap.foundation.shared.config;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {

    // 서버와 클라이언트 간 "오늘" 날짜 일관성을 위해 기본 시간대를 Asia/Seoul로 설정한다.
    // 데이터베이스에 저장되는 Instant 절대 시각에는 영향을 주지 않는다.
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    @Bean
    Clock clock() {
        return Clock.system(ZONE);
    }

    /**
     * A LocalDateTime sent in a body is a Seoul wall-clock time. Read leniently, a trailing Z is dropped without a word
     * and a UTC time is taken as Seoul's, so a value with a zone is not read and the request is refused.
     */
    @Bean
    JsonMapperBuilderCustomizer strictLocalDateTime() {
        return builder -> builder.withConfigOverride(
                LocalDateTime.class, override -> override.setFormat(JsonFormat.Value.forLeniency(false)));
    }
}
