package xyz.goraebap.foundation.shared.config;

import java.io.IOException;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.io.Writer;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.GeneralSecurityException;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.Properties;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertiesPropertySource;

/**
 * Secrets nobody set are made on the first start and kept in secrets.properties beside the database, the way GitLab
 * keeps gitlab-secrets.json: the session signing key (app.auth.secret), the browser push key pair (app.push.vapid-*)
 * and the key repository tokens are sealed under (app.git.encryption-key). A value set in the environment always wins, so dev and prod keep theirs. Losing the file signs
 * everyone out and ends every device's push subscription, so it is backed up with the database. Tests turn this off
 * (app.secrets.generate=false).
 */
public class GeneratedSecrets implements EnvironmentPostProcessor, Ordered {
    static final String FILE = "secrets.properties";
    private static final String AUTH = "app.auth.secret";
    private static final String GIT = "app.git.encryption-key";
    private static final String VAPID_PUBLIC = "app.push.vapid-public-key";
    private static final String VAPID_PRIVATE = "app.push.vapid-private-key";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (!environment.getProperty("app.secrets.generate", Boolean.class, true)) return;
        boolean auth = blank(environment, AUTH);
        boolean vapid = blank(environment, VAPID_PUBLIC) || blank(environment, VAPID_PRIVATE);
        boolean git = blank(environment, GIT);
        if (!auth && !vapid && !git) return;
        Path file = Path.of(environment.getProperty("DB_PATH", "./data/foundation.db"))
                .toAbsolutePath()
                .resolveSibling(FILE);
        Properties kept = read(file);
        boolean changed = false;
        if (auth && kept.getProperty(AUTH) == null) {
            byte[] random = new byte[48];
            RANDOM.nextBytes(random);
            kept.setProperty(AUTH, Base64.getEncoder().encodeToString(random));
            changed = true;
        }
        if (git && kept.getProperty(GIT) == null) {
            byte[] random = new byte[32];
            RANDOM.nextBytes(random);
            kept.setProperty(GIT, Base64.getEncoder().encodeToString(random));
            changed = true;
        }
        if (vapid && kept.getProperty(VAPID_PRIVATE) == null) {
            putVapid(kept);
            changed = true;
        }
        if (changed) write(file, kept);
        Properties used = new Properties();
        if (auth) used.setProperty(AUTH, kept.getProperty(AUTH));
        if (git) used.setProperty(GIT, kept.getProperty(GIT));
        if (vapid) {
            used.setProperty(VAPID_PUBLIC, kept.getProperty(VAPID_PUBLIC));
            used.setProperty(VAPID_PRIVATE, kept.getProperty(VAPID_PRIVATE));
        }
        environment.getPropertySources().addFirst(new PropertiesPropertySource("generatedSecrets", used));
    }

    /** After the configuration files are read, so their values count as set. */
    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    private static boolean blank(ConfigurableEnvironment environment, String name) {
        String value = environment.getProperty(name);
        return value == null || value.isBlank();
    }

    /** URL-safe Base64 of the raw P-256 point and scalar, the form WebPushGateway reads. */
    private static void putVapid(Properties kept) {
        try {
            var generator = KeyPairGenerator.getInstance("EC");
            generator.initialize(new ECGenParameterSpec("secp256r1"));
            var pair = generator.generateKeyPair();
            var point = ((ECPublicKey) pair.getPublic()).getW();
            byte[] raw = new byte[65];
            raw[0] = 4;
            copy(point.getAffineX(), raw, 1);
            copy(point.getAffineY(), raw, 33);
            byte[] scalar = new byte[32];
            copy(((ECPrivateKey) pair.getPrivate()).getS(), scalar, 0);
            var encoder = Base64.getUrlEncoder().withoutPadding();
            kept.setProperty(VAPID_PUBLIC, encoder.encodeToString(raw));
            kept.setProperty(VAPID_PRIVATE, encoder.encodeToString(scalar));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    /** The number as 32 big-endian bytes at offset, left-padded or with its sign byte dropped. */
    private static void copy(BigInteger number, byte[] target, int offset) {
        byte[] bytes = number.toByteArray();
        int from = Math.max(0, bytes.length - 32);
        int length = bytes.length - from;
        System.arraycopy(bytes, from, target, offset + 32 - length, length);
    }

    private static Properties read(Path file) {
        Properties properties = new Properties();
        if (!Files.isRegularFile(file)) return properties;
        try (Reader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            properties.load(reader);
            return properties;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void write(Path file, Properties properties) {
        try {
            Files.createDirectories(java.util.Objects.requireNonNull(file.getParent()));
            try (Writer writer = Files.newBufferedWriter(file, StandardCharsets.UTF_8)) {
                properties.store(writer, "Made by the server on first start; keep with the database, never commit.");
            }
            try {
                Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("rw-------"));
            } catch (UnsupportedOperationException windows) {
                // Windows has no POSIX modes; the file stays in the user's own folder.
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
