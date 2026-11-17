package xyz.goraebap;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import xyz.goraebap.shared.persistence.ModuleMigration;

/**
 * 이 서버가 적용하는 마이그레이션 묶음. 묶음마다 자기 폴더와 자기 기록표를 갖고 V1부터 따로 센다. 낮은 순서가 먼저다.
 */
@Configuration
class Migrations {
    @Bean
    ModuleMigration foundationMigration() {
        return new ModuleMigration("foundation", "classpath:db/foundation", 0);
    }

    @Bean
    ModuleMigration workspaceMigration() {
        return new ModuleMigration("workspace", "classpath:db/workspace", 10);
    }
}
