package com.connecthub.repository;

import com.connecthub.entity.GlobalMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GlobalMessageRepository extends JpaRepository<GlobalMessage, Long> {

    List<GlobalMessage> findTop100ByOrderByIdDesc();
}
