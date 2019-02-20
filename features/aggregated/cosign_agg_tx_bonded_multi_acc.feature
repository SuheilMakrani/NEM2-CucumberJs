Feature: cosign 2 accounts aggregate bonded tx

    Scenario Outline: cosign two accounts aggregate bonded tx
        Given Alice needs to cosign two accounts aggregate bonded tx
        When fetching aggregate bonded transaction to be signed with "<alice_privatekey>" and "<bob_privatekey>" from "<host_url>"
        Then "<alice_privatekey>" should cosign pending multiaccount transactions and announce

        Examples:
            | host_url                        | alice_privatekey                                                 | bob_privatekey                                                   |
            | http://catapult48gh23s.xyz:3000 | 8589CBBCBAF5046F4C47CC1A715A37BC20548B4A6A5F44564B23929E9782D968 | 02FD6F158A8E6FC348EEFA5641B1533EE515CE33E6BF6ECEB3C4DE91278BB031 |