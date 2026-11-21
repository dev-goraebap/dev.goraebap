package xyz.goraebap.shared.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The screens' install manifest (web/public/manifest.webmanifest) under its own media type, which the
 * file name alone does not give the resource handler of ScreenConfig.
 */
@RestController
class ManifestController {
    private static final MediaType MANIFEST = MediaType.parseMediaType("application/manifest+json");
    private final Resource manifest;

    ManifestController(ResourceLoader loader, @Value("${app.screens:classpath:/static/}") String screens) {
        this.manifest = loader.getResource((screens.endsWith("/") ? screens : screens + "/") + "manifest.webmanifest");
    }

    @GetMapping("/manifest.webmanifest")
    ResponseEntity<Resource> manifest() {
        if (!manifest.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MANIFEST)
                .cacheControl(CacheControl.noCache())
                .body(manifest);
    }
}
