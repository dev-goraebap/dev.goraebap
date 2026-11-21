package xyz.goraebap.foundation.file.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import xyz.goraebap.foundation.file.application.HtmlEmbeds;

/**
 * The chain for uploaded HTML shown in a body (/api/embeds/**), ahead of the /api/** chain. The page is someone's
 * script served from our own origin, so every response is sandboxed (no origin: no cookies, no storage, no calls to
 * the API as the reader) and may be framed by our screens only. The signed link is the permission, so there is no
 * session, and nothing here changes state.
 */
@Configuration
class HtmlEmbedSecurityConfig {
    private static final String POLICY =
            "sandbox allow-scripts allow-modals allow-forms allow-popups; frame-ancestors 'self'";

    @Bean
    @Order(0)
    SecurityFilterChain htmlEmbedChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .securityMatcher(HtmlEmbeds.PATH + "/**")
                .headers(headers -> headers.frameOptions(frame -> frame.disable())
                        .cacheControl(cache -> cache.disable())
                        .contentSecurityPolicy(policy -> policy.policyDirectives(POLICY))
                        .referrerPolicy(policy -> policy.policy(ReferrerPolicy.NO_REFERRER)))
                .sessionManagement(config -> config.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(config -> config.disable())
                .formLogin(config -> config.disable())
                .httpBasic(config -> config.disable())
                .logout(config -> config.disable())
                .csrf(config -> config.disable())
                .authorizeHttpRequests(config -> {
                    config.requestMatchers(HttpMethod.GET, HtmlEmbeds.PATH + "/**")
                            .permitAll();
                    config.requestMatchers(HttpMethod.HEAD, HtmlEmbeds.PATH + "/**")
                            .permitAll();
                    config.anyRequest().denyAll();
                })
                .build();
    }
}
