package xyz.goraebap.app;

import static org.assertj.core.api.Assertions.assertThat;

import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import java.io.File;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.jooq.PlainSQL;
import org.jooq.Schema;
import org.jooq.Table;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * 컨텍스트 맵(contexts.json)과 코드가 같은지 본다. 맵은 컨텍스트마다 가진 표, 내놓은 뷰, 참조하는 컨텍스트를 적는다. 여기서
 * 지키는 것은 경계다. 하위 도메인 종류와 그룹이 옳은지는 사람이 판단하고, 이 테스트는 그 판단이 낳는 결과만 알려 준다.
 */
class ContextMapTest {
    private static final List<String> RANK = List.of("generic", "supporting", "core");

    private record Context(
            String name,
            String pkg,
            String group,
            String subdomain,
            Set<String> tables,
            Set<String> views,
            Set<String> uses) {
        boolean holds(JavaClass type) {
            return within(type, pkg);
        }
    }

    private static final Map<String, Context> CONTEXTS = new LinkedHashMap<>();
    private static final List<String> SHARED = new ArrayList<>();
    private static final List<String> ASSEMBLY = new ArrayList<>();
    private static final List<String> JOOQ = new ArrayList<>();

    /** 생성된 표 클래스와 레코드 클래스의 이름에서 표 이름으로. */
    private static final Map<String, String> TABLE_OF_CLASS = new HashMap<>();

    /** 생성된 Tables 클래스의 "클래스이름#필드이름"에서 표 이름으로. */
    private static final Map<String, String> TABLE_OF_FIELD = new HashMap<>();

    private static final Set<String> TABLES = new TreeSet<>();
    private static JavaClasses classes;

    @BeforeAll
    static void read() throws Exception {
        JsonNode map = new ObjectMapper().readTree(new File(System.getProperty("contexts.file")));
        map.get("shared").forEach(node -> SHARED.add(node.asString()));
        map.get("assembly").forEach(node -> ASSEMBLY.add(node.asString()));
        map.get("jooq").forEach(node -> JOOQ.add(node.asString()));
        for (var entry : map.get("contexts").properties()) {
            JsonNode node = entry.getValue();
            CONTEXTS.put(
                    entry.getKey(),
                    new Context(
                            entry.getKey(),
                            node.get("package").asString(),
                            node.get("group").asString(),
                            node.get("subdomain").asString(),
                            names(node.get("tables")),
                            names(node.get("views")),
                            names(node.get("uses"))));
        }
        for (String pkg : JOOQ) {
            var schema =
                    (Schema) Class.forName(pkg + ".DefaultSchema").getField("DEFAULT_SCHEMA").get(null);
            for (Table<?> table : schema.getTables()) {
                TABLES.add(table.getName());
                TABLE_OF_CLASS.put(table.getClass().getName(), table.getName());
                TABLE_OF_CLASS.put(table.getRecordType().getName(), table.getName());
            }
            Class<?> holder = Class.forName(pkg + ".Tables");
            for (var field : holder.getFields())
                if (Modifier.isStatic(field.getModifiers()) && field.get(null) instanceof Table<?> table)
                    TABLE_OF_FIELD.put(holder.getName() + "#" + field.getName(), table.getName());
        }
        classes = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages(map.get("base").asString());
    }

    private static Set<String> names(JsonNode array) {
        var names = new TreeSet<String>();
        array.forEach(node -> names.add(node.asString()));
        return names;
    }

    private static boolean within(JavaClass type, String pkg) {
        return type.getPackageName().equals(pkg) || type.getPackageName().startsWith(pkg + ".");
    }

    private static boolean generated(JavaClass type) {
        return JOOQ.stream().anyMatch(pkg -> within(type, pkg));
    }

    private static boolean shared(JavaClass type) {
        return SHARED.stream().anyMatch(pkg -> within(type, pkg));
    }

    private static Context contextOf(JavaClass type) {
        if (generated(type)) return null;
        return CONTEXTS.values().stream()
                .filter(context -> context.holds(type))
                .findFirst()
                .orElse(null);
    }

    private static Context ownerOf(String table) {
        return CONTEXTS.values().stream()
                .filter(context -> context.tables().contains(table) || context.views().contains(table))
                .findFirst()
                .orElse(null);
    }

    /** 이 클래스가 읽거나 쓰는 표와 뷰. 생성된 표 클래스, 레코드 클래스, Tables의 필드를 본다. */
    private static Set<String> tablesTouchedBy(JavaClass type) {
        var touched = new TreeSet<String>();
        type.getDirectDependenciesFromSelf().forEach(dependency -> {
            String table = TABLE_OF_CLASS.get(dependency.getTargetClass().getName());
            if (table != null) touched.add(table);
        });
        type.getFieldAccessesFromSelf().forEach(access -> {
            String table = TABLE_OF_FIELD.get(access.getTargetOwner().getName() + "#" + access.getName());
            if (table != null) touched.add(table);
        });
        return touched;
    }

    @Test
    void 맵의_값이_바르다() {
        var problems = new ArrayList<String>();
        for (Context context : CONTEXTS.values()) {
            if (!RANK.contains(context.subdomain())) problems.add(context.name() + ": subdomain은 " + RANK + " 중 하나다");
            for (String used : context.uses())
                if (!CONTEXTS.containsKey(used)) problems.add(context.name() + ": uses의 " + used + "는 맵에 없다");
            if (context.uses().contains(context.name())) problems.add(context.name() + ": 자기를 uses에 적지 않는다");
            // 그룹 폴더가 있으면 폴더 이름과 group이 같다. module 바로 아래에 둔 컨텍스트는 그룹 폴더가 없다.
            String parent = context.pkg().substring(0, context.pkg().lastIndexOf('.'));
            String folder = parent.substring(parent.lastIndexOf('.') + 1);
            if (!folder.equals("module") && !folder.equals(context.group()))
                problems.add(context.name() + ": 폴더는 " + folder + "인데 group은 " + context.group() + "다");
        }
        assertThat(problems).isEmpty();
    }

    @Test
    void 모든_클래스가_컨텍스트나_shared에_속한다() {
        var strays = new TreeSet<String>();
        for (JavaClass type : classes) {
            if (generated(type) || shared(type) || contextOf(type) != null) continue;
            if (ASSEMBLY.contains(type.getPackageName())) continue;
            strays.add(type.getPackageName());
        }
        assertThat(strays).as("맵에 없는 패키지").isEmpty();
        for (Context context : CONTEXTS.values())
            assertThat(classes.stream().anyMatch(context::holds))
                    .as(context.name() + "의 패키지 " + context.pkg() + "에 클래스가 있다")
                    .isTrue();
    }

    @Test
    void 표와_뷰마다_주인이_하나다() {
        var owned = new ArrayList<String>();
        CONTEXTS.values().forEach(context -> {
            owned.addAll(context.tables());
            owned.addAll(context.views());
        });
        assertThat(owned).as("두 컨텍스트가 같은 표를 가질 수 없다").doesNotHaveDuplicates();
        assertThat(new TreeSet<>(owned)).as("맵의 표와 스키마의 표").isEqualTo(TABLES);
    }

    @Test
    void 남의_표를_읽지_않는다() {
        var problems = new TreeSet<String>();
        for (JavaClass type : classes) {
            if (generated(type)) continue;
            Context context = contextOf(type);
            for (String table : tablesTouchedBy(type)) {
                Context owner = ownerOf(table);
                if (owner == null) continue;
                if (context == null) {
                    problems.add(type.getName() + ": 컨텍스트 밖에서 표 " + table + "를 읽는다");
                } else if (owner != context && !owner.views().contains(table)) {
                    problems.add(type.getName() + ": " + owner.name() + "의 표 " + table + "를 읽는다. 공개 뷰나 Facade를 쓴다");
                }
            }
        }
        assertThat(problems).isEmpty();
    }

    @Test
    void 적어_둔_컨텍스트만_참조한다() {
        var problems = new TreeSet<String>();
        var seen = new HashMap<String, Set<String>>();
        for (JavaClass type : classes) {
            Context context = contextOf(type);
            if (context == null) continue;
            var used = seen.computeIfAbsent(context.name(), name -> new TreeSet<>());
            type.getDirectDependenciesFromSelf().forEach(dependency -> {
                Context target = contextOf(dependency.getTargetClass());
                if (target != null && target != context) used.add(target.name());
            });
            for (String table : tablesTouchedBy(type)) {
                Context owner = ownerOf(table);
                if (owner != null && owner != context) used.add(owner.name());
            }
        }
        for (Context context : CONTEXTS.values()) {
            var used = seen.getOrDefault(context.name(), Set.of());
            for (String name : used)
                if (!context.uses().contains(name)) problems.add(context.name() + " → " + name + ": 코드에 있는데 uses에 없다");
            for (String name : context.uses())
                if (!used.contains(name)) problems.add(context.name() + " → " + name + ": uses에 있는데 코드에 없다");
        }
        assertThat(problems).isEmpty();
    }

    @Test
    void 남의_내부를_쓰지_않는다() {
        var problems = new TreeSet<String>();
        for (JavaClass type : classes) {
            Context context = contextOf(type);
            if (context == null) continue;
            type.getDirectDependenciesFromSelf().forEach(dependency -> {
                JavaClass target = dependency.getTargetClass();
                Context owner = contextOf(target);
                if (owner != null && owner != context && !target.getPackageName().equals(owner.pkg()))
                    problems.add(type.getName() + " → " + target.getName() + ": " + owner.name() + "의 공개 계약은 "
                            + owner.pkg() + " 바로 아래에만 있다");
            });
        }
        assertThat(problems).isEmpty();
    }

    @Test
    void shared는_컨텍스트를_모른다() {
        var problems = new TreeSet<String>();
        for (JavaClass type : classes) {
            if (!shared(type)) continue;
            type.getDirectDependenciesFromSelf().forEach(dependency -> {
                Context target = contextOf(dependency.getTargetClass());
                if (target != null)
                    problems.add(type.getName() + " → " + dependency.getTargetClass().getName());
            });
            if (!tablesTouchedBy(type).isEmpty()) problems.add(type.getName() + ": shared는 표를 읽지 않는다");
        }
        assertThat(problems).isEmpty();
    }

    @Test
    void 아래_종류는_위_종류를_참조하지_않는다() {
        var problems = new TreeSet<String>();
        for (Context context : CONTEXTS.values())
            for (String name : context.uses()) {
                Context used = CONTEXTS.get(name);
                if (used != null && RANK.indexOf(used.subdomain()) > RANK.indexOf(context.subdomain()))
                    problems.add(context.name() + "(" + context.subdomain() + ") → " + used.name() + "("
                            + used.subdomain() + ")");
            }
        assertThat(problems).as("generic, supporting, core 순서에서 자기보다 뒤의 것을 참조하지 않는다").isEmpty();
    }

    @Test
    void 문자열로_쓴_SQL로_표를_읽지_않는다() {
        var problems = new TreeSet<String>();
        for (JavaClass type : classes) {
            if (contextOf(type) == null) continue;
            type.getMethodCallsFromSelf().forEach(call -> {
                if (call.getTarget().isAnnotatedWith(PlainSQL.class))
                    problems.add(type.getName() + ": " + call.getTarget().getFullName());
            });
            type.getDirectDependenciesFromSelf().forEach(dependency -> {
                String target = dependency.getTargetClass().getName();
                if (target.startsWith("org.springframework.jdbc.core.")
                        || target.equals("java.sql.Statement")
                        || target.equals("java.sql.PreparedStatement"))
                    problems.add(type.getName() + " → " + target);
            });
        }
        // 로그 DB를 통째로 백업하는 VACUUM INTO 하나만 문자열로 쓴다. 표 이름이 없다.
        problems.removeIf(problem -> problem.contains(".system.infrastructure.LogMaintenance"));
        assertThat(problems).as("jOOQ가 만든 표 클래스로만 읽어야 표의 주인을 검사할 수 있다").isEmpty();
    }
}
