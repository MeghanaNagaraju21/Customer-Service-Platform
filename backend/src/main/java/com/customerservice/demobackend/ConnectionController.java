
package com.customerservice.demobackend;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = {
    "http://127.0.0.1:5500",
    "http://localhost:5500"
})
public class ConnectionController {

    @GetMapping("/api/connection")
    public String connection() {
        return "Frontend and Backend Connected Successfully!";
    }
}
