package xyz.goraebap;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

class ArchitectureTest {

    private static final Path MAIN_ROOT = Path.of("src/main/java/xyz/goraebap");
    private static final Pattern IMPORT_PATTERN = Pattern.compile("^import\\s+(?:static\\s+)?([a-zA-Z0-9_.]+);");
    private static final Set<String> INTERNAL_LAYERS = Set.of("application", "domain", "infrastructure");
    private static final Set<String> NON_PRODUCT_GROUPS = Set.of("shared", "foundation", "jooq");

    @Test
    void sharedDoesNotDependOnAnyBusinessContext() throws IOException {
        List<String> violations = new ArrayList<>();
        for (JavaSource source : readJavaSources(MAIN_ROOT.resolve("shared"))) {
            for (String imp : source.imports()) {
                if (!imp.startsWith("xyz.goraebap.")) {
                    continue;
                }
                String group = firstSegmentAfterRoot(imp);
                if (!group.equals("shared") && !group.equals("jooq")) {
                    violations.add(source.relativePath() + " -> " + imp);
                }
            }
        }
        assertThat(violations)
                .as("xyz.goraebap.shared must not depend on business packages")
                .isEmpty();
    }

    @Test
    void foundationDoesNotDependOnProductGroups() throws IOException {
        List<String> violations = new ArrayList<>();
        for (JavaSource source : readJavaSources(MAIN_ROOT.resolve("foundation"))) {
            for (String imp : source.imports()) {
                if (!imp.startsWith("xyz.goraebap.")) {
                    continue;
                }
                String group = firstSegmentAfterRoot(imp);
                if (!NON_PRODUCT_GROUPS.contains(group)) {
                    violations.add(source.relativePath() + " -> " + imp);
                }
            }
        }
        assertThat(violations)
                .as("xyz.goraebap.foundation must not depend on product groups (e.g. productivity)")
                .isEmpty();
    }

    @Test
    void contextsDoNotImportOtherContextsInternalLayers() throws IOException {
        List<String> violations = new ArrayList<>();
        for (JavaSource source : readJavaSources(MAIN_ROOT)) {
            String ownerContext = contextOf(source.packageName());
            if (ownerContext == null) {
                continue;
            }
            for (String imp : source.imports()) {
                String targetContext = contextOf(imp);
                if (targetContext == null || targetContext.equals(ownerContext)) {
                    continue;
                }
                String targetLayer = layerOf(imp);
                if (targetLayer != null && INTERNAL_LAYERS.contains(targetLayer)) {
                    violations.add(source.relativePath() + " (" + ownerContext + ") -> " + imp);
                }
            }
        }
        assertThat(violations)
                .as("Contexts must only import other contexts' root public contracts")
                .isEmpty();
    }

    @Test
    void domainDoesNotDependOnOuterLayersOrFrameworks() throws IOException {
        List<String> violations = new ArrayList<>();
        for (JavaSource source : readJavaSources(MAIN_ROOT)) {
            if (!"domain".equals(layerOf(source.packageName()))) {
                continue;
            }
            for (String imp : source.imports()) {
                String targetLayer = layerOf(imp);
                boolean outerLayer = "application".equals(targetLayer) || "infrastructure".equals(targetLayer);
                boolean forbiddenFramework = imp.startsWith("org.springframework.")
                        || imp.startsWith("org.jooq.")
                        || imp.startsWith("xyz.goraebap.jooq.");
                if (outerLayer || forbiddenFramework) {
                    violations.add(source.relativePath() + " -> " + imp);
                }
            }
        }
        assertThat(violations)
                .as("Domain packages must stay pure without application, infrastructure, Spring, or jOOQ dependencies")
                .isEmpty();
    }

    private static List<JavaSource> readJavaSources(Path dir) throws IOException {
        if (!Files.exists(dir)) {
            return List.of();
        }
        List<JavaSource> results = new ArrayList<>();
        try (Stream<Path> stream = Files.walk(dir)) {
            List<Path> files =
                    stream.filter(p -> p.toString().endsWith(".java")).toList();
            for (Path file : files) {
                List<String> lines = Files.readAllLines(file);
                String packageName = "";
                List<String> imports = new ArrayList<>();
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("package ") && trimmed.endsWith(";")) {
                        packageName = trimmed.substring("package ".length(), trimmed.length() - 1)
                                .trim();
                    } else if (trimmed.startsWith("import ")) {
                        Matcher matcher = IMPORT_PATTERN.matcher(trimmed);
                        if (matcher.matches()) {
                            imports.add(matcher.group(1));
                        }
                    }
                }
                String rel = MAIN_ROOT.relativize(file).toString().replace('\\', '/');
                results.add(new JavaSource(rel, packageName, imports));
            }
        }
        return results;
    }

    private static String firstSegmentAfterRoot(String fqn) {
        String rest = fqn.substring("xyz.goraebap.".length());
        int dot = rest.indexOf('.');
        return dot < 0 ? rest : rest.substring(0, dot);
    }

    private static String contextOf(String fqn) {
        if (!fqn.startsWith("xyz.goraebap.")) {
            return null;
        }
        String[] parts = fqn.substring("xyz.goraebap.".length()).split("\\.");
        if (parts.length < 2) {
            return null;
        }
        String group = parts[0];
        if (group.equals("shared") || group.equals("jooq")) {
            return null;
        }
        return group + "." + parts[1];
    }

    private static String layerOf(String fqn) {
        if (!fqn.startsWith("xyz.goraebap.")) {
            return null;
        }
        String[] parts = fqn.substring("xyz.goraebap.".length()).split("\\.");
        if (parts.length < 3) {
            return null;
        }
        String group = parts[0];
        if (group.equals("shared") || group.equals("jooq")) {
            return null;
        }
        return parts[2];
    }

    private record JavaSource(String relativePath, String packageName, List<String> imports) {}
}
