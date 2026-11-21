package xyz.goraebap.cowork.module.workspace.richbody.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.InetAddress;
import java.net.URI;
import org.junit.jupiter.api.Test;

class HttpPageReaderTest {
    @Test
    void 안쪽_망의_주소는_공개_주소가_아니다() throws Exception {
        for (String address : new String[] {
            "127.0.0.1",
            "10.1.2.3",
            "172.16.0.1",
            "192.168.0.10",
            "169.254.169.254",
            "100.64.0.1",
            "0.0.0.0",
            "::1",
            "fd00::1",
            "fe80::1",
            "::ffff:10.0.0.1",
            "64:ff9b::a00:1"
        })
            assertThat(HttpPageReader.isPublic(InetAddress.getByName(address)))
                    .as(address)
                    .isFalse();
    }

    @Test
    void 인터넷의_주소는_공개_주소다() throws Exception {
        for (String address : new String[] {"8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"})
            assertThat(HttpPageReader.isPublic(InetAddress.getByName(address)))
                    .as(address)
                    .isTrue();
    }

    @Test
    void https의_기본_포트가_아니면_부르지_않는다() {
        assertThat(HttpPageReader.isPublic(URI.create("http://8.8.8.8/"))).isFalse();
        assertThat(HttpPageReader.isPublic(URI.create("https://8.8.8.8:8443/"))).isFalse();
        assertThat(HttpPageReader.isPublic(URI.create("https://127.0.0.1/"))).isFalse();
    }
}
