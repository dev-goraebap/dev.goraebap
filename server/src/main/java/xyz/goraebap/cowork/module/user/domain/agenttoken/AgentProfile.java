package xyz.goraebap.cowork.module.user.domain.agenttoken;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;

@Getter
@AllArgsConstructor(staticName = "fromPersistence")
public class AgentProfile {
    private final UUID id;
    private final UUID userId;
    private String name;
    private String icon;
    private String color;
    private long version;

    public static AgentProfile create(UUID id, UUID userId, String name, String icon, String color) {
        var profile = new AgentProfile(id, userId, "", "", "", 0);
        profile.assign(name, icon, color);
        return profile;
    }

    public void revise(String name, String icon, String color) {
        assign(name, icon, color);
        version++;
    }

    private void assign(String name, String icon, String color) {
        String clean = name == null ? "" : name.strip();
        if (clean.isEmpty() || clean.length() > 64) throw new DomainRuleViolation("에이전트 이름은 1~64자입니다");
        if (icon == null || icon.length() > 100 || !icon.matches("[A-Za-z0-9:_-]+"))
            throw new DomainRuleViolation("에이전트 아이콘을 골라 주세요");
        if (color == null || !color.matches("#[0-9a-fA-F]{6}")) throw new DomainRuleViolation("에이전트 색상을 골라 주세요");
        this.name = clean;
        this.icon = icon;
        this.color = color.toLowerCase(java.util.Locale.ROOT);
    }
}
